/**
 * Local persistence for the VEX app. Team "numbers" are strings (e.g. "1234A"),
 * so favorites and the primary team are stored as strings.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  primaryTeam: '@vexscout/primaryTeam',
  favorites: '@vexscout/favorites',
  themePref: '@vexscout/themePref',
} as const;

export type ThemePref = 'light' | 'dark' | 'system';

export async function getPrimaryTeam(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.primaryTeam);
}

export async function savePrimaryTeam(teamNumber: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.primaryTeam, teamNumber);
  await addFavorite(teamNumber);
}

export async function getFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.favorites);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

async function writeFavorites(list: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.favorites, JSON.stringify(list));
}

export async function addFavorite(teamNumber: string): Promise<string[]> {
  const current = await getFavorites();
  if (current.includes(teamNumber)) return current;
  const next = [...current, teamNumber];
  await writeFavorites(next);
  return next;
}

export async function removeFavorite(teamNumber: string): Promise<string[]> {
  const current = await getFavorites();
  const next = current.filter((n) => n !== teamNumber);
  await writeFavorites(next);
  return next;
}

export async function toggleFavorite(teamNumber: string): Promise<string[]> {
  const current = await getFavorites();
  return current.includes(teamNumber)
    ? removeFavorite(teamNumber)
    : addFavorite(teamNumber);
}

export async function getThemePref(): Promise<ThemePref> {
  const raw = (await AsyncStorage.getItem(KEYS.themePref)) as ThemePref | null;
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

export async function saveThemePref(pref: ThemePref): Promise<void> {
  await AsyncStorage.setItem(KEYS.themePref, pref);
}

export async function clearApiCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith('@vexscout/cache/'));
  if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
}
