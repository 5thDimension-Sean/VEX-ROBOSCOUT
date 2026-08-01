# VEX robotScout

A cross-platform (iOS & Android) app for VEX Robotics Competition (VRC) — track teams, discover nearby events, view match schedules, TrueSkill rankings, and **World Skills** standings.

Built with **Expo (React Native + TypeScript)**. Companion to FTC robotScout.

## Setup

1. **Install Node 20+**.
2. Install dependencies:
   ```bash
   npm install
   ```
3. **Add a RobotEvents API token.** Get one at
   <https://www.robotevents.com/api/v2> (Account → API), then:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `EXPO_PUBLIC_VEX_API_TOKEN`. **`.env` is git-ignored — never commit it.**
   Optionally pin `EXPO_PUBLIC_VEX_SEASON_ID`; otherwise the current VRC season is resolved automatically.
4. Start:
   ```bash
   npm start          # press 'a' for Android, 'w' for web
   ```

## Tabs

| Tab | What it does |
| --- | --- |
| **Favorites** | Primary team banner, favorites list, "Find an Event" |
| **TrueSkill** | Bayesian μ − 3σ leaderboard from real match results |
| **Lookup** | Team search (e.g. `1234A`) + geolocation-sorted events |
| **World Skills** | Driver + programming skills leaderboard (best of each) |
| **Settings** | Theme, primary team, clear cache |

## Notes

- Uses the **RobotEvents API** (`events.vex.com/api/v2`, Bearer auth). VEX team
  numbers are strings (`1234A`); the program id is VRC (1).
- TrueSkill and World Skills are computed on-device over a bounded set of events
  (the events your favorited teams attend). Global standings would need a backend.
- The TrueSkill engine is shared with FTC robotScout and validated against the
  canonical reference values.
