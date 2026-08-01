/**
 * App configuration for the VEX (VRC) app.
 *
 * Uses the RobotEvents API (Bearer token). Get a token at
 * https://www.robotevents.com/api/v2 (Account → API). Set it in a local
 * `.env` (git-ignored):
 *
 *   EXPO_PUBLIC_VEX_API_TOKEN=your-bearer-token
 *   EXPO_PUBLIC_VEX_SEASON_ID=190      # optional; else the current VRC season
 */

export const VEX_API_BASE = 'https://events.vex.com/api/v2';

/** RobotEvents program id for the VEX V5 Robotics Competition (VRC). */
export const VRC_PROGRAM_ID = 1;

export const config = {
  apiBase: VEX_API_BASE,
  token: process.env.EXPO_PUBLIC_VEX_API_TOKEN ?? '',
  /** Optional pinned season id; when empty, the client resolves the current VRC season. */
  seasonId: process.env.EXPO_PUBLIC_VEX_SEASON_ID
    ? Number(process.env.EXPO_PUBLIC_VEX_SEASON_ID)
    : null,
  programId: VRC_PROGRAM_ID,
};

export const hasCredentials = (): boolean => config.token.length > 0;
