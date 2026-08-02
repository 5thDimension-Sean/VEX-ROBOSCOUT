/**
 * App configuration for the VEX (VRC) app.
 *
 * Uses the Public VEX Events API (https://events.vex.com/api/v2), which is
 * VEX's own platform following the 2026 VEX/RECF split. Auth is a Bearer JWT.
 *
 * Set these in a local `.env` (git-ignored):
 *
 *   EXPO_PUBLIC_VEX_API_TOKEN=your-bearer-jwt
 *   EXPO_PUBLIC_VEX_PROGRAM_ID=1     # optional; V5RC (formerly VRC). See below.
 *   EXPO_PUBLIC_VEX_SEASON_ID=       # optional; else the current season is resolved
 *
 * Program IDs: the VEX Events API groups data by program (V5RC, VIQRC, VURC,
 * VEX AI, …). This app defaults to program 1 (the flagship V5RC / formerly VRC).
 * If your data comes back for the wrong program after the rebrand, set
 * EXPO_PUBLIC_VEX_PROGRAM_ID — the Settings screen can also list programs.
 */

import { Platform } from 'react-native';

export const VEX_API_BASE = 'https://events.vex.com/api/v2';

/**
 * Deployed token proxy (Cloudflare Worker). This URL is public and non-secret —
 * the VEX Bearer token lives inside the Worker, never in this bundle. The web
 * build defaults to it so the hosted site works with no CI config; native/local
 * dev defaults to direct mode. Override either with EXPO_PUBLIC_VEX_PROXY_URL.
 */
const DEFAULT_PROXY_URL =
  Platform.OS === 'web'
    ? 'https://vex-robotscout-proxy.5thdimension-sean.workers.dev'
    : '';

/** Default program: V5RC (formerly VRC). Override via env if needed. */
export const DEFAULT_PROGRAM_ID = 1;

export const config = {
  apiBase: VEX_API_BASE,
  proxyUrl: process.env.EXPO_PUBLIC_VEX_PROXY_URL || DEFAULT_PROXY_URL,
  token: process.env.EXPO_PUBLIC_VEX_API_TOKEN ?? '',
  programId: process.env.EXPO_PUBLIC_VEX_PROGRAM_ID
    ? Number(process.env.EXPO_PUBLIC_VEX_PROGRAM_ID)
    : DEFAULT_PROGRAM_ID,
  seasonId: process.env.EXPO_PUBLIC_VEX_SEASON_ID
    ? Number(process.env.EXPO_PUBLIC_VEX_SEASON_ID)
    : null,
};

/**
 * True when the app should route through the proxy Worker (web deploy) instead
 * of calling events.vex.com directly with the Bearer token. The VEX API allows
 * CORS, so the proxy's purpose is to keep the token out of the public bundle.
 */
export const useProxy = (): boolean => config.proxyUrl.length > 0;

export const hasCredentials = (): boolean =>
  useProxy() || config.token.length > 0;
