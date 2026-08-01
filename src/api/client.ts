/**
 * VEX Events API client (events.vex.com/api/v2).
 *
 * Bearer-token auth, pagination handling, an AsyncStorage cache with TTL and
 * stale-fallback, and automatic current-season resolution.
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, hasCredentials } from '../config/env';
import type {
  Paginated,
  VexTeam,
  VexEvent,
  VexMatch,
  VexSkill,
  Season,
} from '../types/vex';

const CACHE_PREFIX = '@vexscout/cache/';
const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour
const MAX_PAGES = 8; // pagination safety cap (250/page → up to 2000 rows)

export class VexApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'VexApiError';
    this.status = status;
  }
}

let instance: AxiosInstance | null = null;

function client(): AxiosInstance {
  if (!hasCredentials()) {
    throw new VexApiError(
      'VEX Events API token is not set. Add EXPO_PUBLIC_VEX_API_TOKEN to your .env file.',
    );
  }
  if (!instance) {
    instance = axios.create({
      baseURL: config.apiBase,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
      timeout: 15000,
    });
  }
  return instance;
}

// ---- Cache ----

interface CacheEntry<T> {
  ts: number;
  data: T;
}

async function readCache<T>(key: string, ttl: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > ttl) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ ts: Date.now(), data } as CacheEntry<T>),
    );
  } catch {
    // best-effort
  }
}

function toError(err: unknown): VexApiError {
  const ax = err as AxiosError;
  if (ax.response) {
    const status = ax.response.status;
    const msg =
      status === 401
        ? 'Authentication failed — check your VEX Events API token.'
        : status === 429
          ? 'Rate limited by the VEX Events API — try again shortly.'
          : status === 404
            ? 'Not found.'
            : `Request failed (${status}).`;
    return new VexApiError(msg, status);
  }
  return new VexApiError(ax.message || 'Network error.');
}

/**
 * Fetches all pages of a paginated endpoint (up to MAX_PAGES), with caching
 * and stale-fallback on failure.
 */
async function getAllPages<T>(
  path: string,
  params: Record<string, string | number | (string | number)[]> = {},
  opts: { ttl?: number; forceFresh?: boolean } = {},
): Promise<T[]> {
  const { ttl = DEFAULT_TTL_MS, forceFresh = false } = opts;
  const cacheKey = path + '?' + JSON.stringify(params);

  if (!forceFresh) {
    const cached = await readCache<T[]>(cacheKey, ttl);
    if (cached) return cached;
  }

  try {
    const out: T[] = [];
    let page = 1;
    // eslint-disable-next-line no-constant-condition
    while (page <= MAX_PAGES) {
      const res = await client().get<Paginated<T>>(path, {
        params: { ...params, per_page: 250, page },
      });
      out.push(...res.data.data);
      if (page >= res.data.meta.last_page) break;
      page += 1;
    }
    await writeCache(cacheKey, out);
    return out;
  } catch (err) {
    const stale = await readCache<T[]>(cacheKey, Number.POSITIVE_INFINITY);
    if (stale) return stale;
    throw toError(err);
  }
}

// ---- Season resolution ----

let cachedSeasonId: number | null = null;

async function resolveSeasonId(): Promise<number> {
  if (config.seasonId) return config.seasonId;
  if (cachedSeasonId) return cachedSeasonId;
  const seasons = await getAllPages<Season>('/seasons', { 'program[]': config.programId });
  if (seasons.length === 0) throw new VexApiError('No seasons available for this program.');
  const now = Date.now();
  const current =
    seasons.find(
      (s) => new Date(s.start).getTime() <= now && now <= new Date(s.end).getTime(),
    ) ??
    seasons.slice().sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())[0];
  cachedSeasonId = current.id;
  return current.id;
}

// ---- Public API ----

export const vexApi = {
  async currentSeasonId(): Promise<number> {
    return resolveSeasonId();
  },

  /** Look up VRC teams by number string (e.g. "1234A"). */
  async getTeamByNumber(number: string, forceFresh = false): Promise<VexTeam | null> {
    const teams = await getAllPages<VexTeam>(
      '/teams',
      { 'number[]': number, 'program[]': config.programId },
      { forceFresh },
    );
    return teams[0] ?? null;
  },

  /** Teams registered at an event. */
  async getEventTeams(eventId: number, forceFresh = false): Promise<VexTeam[]> {
    return getAllPages<VexTeam>(`/events/${eventId}/teams`, {}, { forceFresh });
  },

  /** Season events, optionally filtered to a team. */
  async getEvents(
    params: { teamId?: number } = {},
    forceFresh = false,
  ): Promise<VexEvent[]> {
    const season = await resolveSeasonId();
    const q: Record<string, string | number | (string | number)[]> = {
      'season[]': season,
      'program[]': config.programId,
    };
    if (params.teamId) q['team[]'] = params.teamId;
    return getAllPages<VexEvent>('/events', q, { forceFresh });
  },

  /** All matches for an event, merged across its divisions. */
  async getEventMatches(
    eventId: number,
    divisions: number[],
    forceFresh = false,
  ): Promise<VexMatch[]> {
    const perDiv = await Promise.all(
      divisions.map((d) =>
        getAllPages<VexMatch>(`/events/${eventId}/divisions/${d}/matches`, {}, { forceFresh }).catch(
          () => [] as VexMatch[],
        ),
      ),
    );
    return perDiv.flat();
  },

  /** Skills results (driver + programming) for an event. */
  async getEventSkills(eventId: number, forceFresh = false): Promise<VexSkill[]> {
    return getAllPages<VexSkill>(`/events/${eventId}/skills`, {}, { forceFresh });
  },
};
