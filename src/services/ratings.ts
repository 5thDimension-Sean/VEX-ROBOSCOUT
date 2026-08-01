/**
 * TrueSkill leaderboard for VEX, computed from RobotEvents match results.
 * Scope is a bounded set of events (e.g. the events your favorited teams
 * attend), since global rankings would need a backend.
 */
import { vexApi } from '../api/client';
import { defaultRating, rate, conservativeScore, type Rating } from '../trueskill/trueskill';
import type { VexEvent, VexMatch } from '../types/vex';

export interface TeamRating {
  teamNumber: string;
  rating: Rating;
  score: number;
  wins: number;
  losses: number;
  ties: number;
}

function matchTime(m: VexMatch): number {
  const raw = m.started || m.scheduled;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? m.round * 1000 + m.matchnum : t;
}

export async function computeLeaderboard(
  events: VexEvent[],
  onProgress?: (done: number, total: number) => void,
): Promise<TeamRating[]> {
  const timed: { match: VexMatch; time: number }[] = [];

  let done = 0;
  for (const event of events) {
    try {
      const matches = await vexApi.getEventMatches(
        event.id,
        event.divisions.map((d) => d.id),
      );
      for (const m of matches) {
        if (m.scored && m.alliances.length === 2) {
          timed.push({ match: m, time: matchTime(m) });
        }
      }
    } catch {
      // skip failed events
    }
    done += 1;
    onProgress?.(done, events.length);
  }

  timed.sort((a, b) => a.time - b.time);

  const ratings = new Map<string, Rating>();
  const record = new Map<string, { w: number; l: number; t: number }>();
  const get = (team: string): Rating => ratings.get(team) ?? defaultRating();
  const rec = (team: string) => record.get(team) ?? { w: 0, l: 0, t: 0 };

  for (const { match } of timed) {
    const red = match.alliances.find((a) => a.color === 'red');
    const blue = match.alliances.find((a) => a.color === 'blue');
    if (!red || !blue) continue;

    const redTeams = red.teams.map((t) => t.team.name).filter(Boolean);
    const blueTeams = blue.teams.map((t) => t.team.name).filter(Boolean);
    if (redTeams.length === 0 || blueTeams.length === 0) continue;

    const result: 1 | -1 | 0 =
      red.score > blue.score ? 1 : blue.score > red.score ? -1 : 0;

    const updated = rate({
      allianceA: redTeams.map(get),
      allianceB: blueTeams.map(get),
      result,
    });
    redTeams.forEach((t, i) => ratings.set(t, updated.allianceA[i]));
    blueTeams.forEach((t, i) => ratings.set(t, updated.allianceB[i]));

    const bump = (teams: string[], key: 'w' | 'l' | 't') =>
      teams.forEach((t) => {
        const r = rec(t);
        r[key] += 1;
        record.set(t, r);
      });
    if (result === 1) {
      bump(redTeams, 'w');
      bump(blueTeams, 'l');
    } else if (result === -1) {
      bump(blueTeams, 'w');
      bump(redTeams, 'l');
    } else {
      bump([...redTeams, ...blueTeams], 't');
    }
  }

  const rows: TeamRating[] = [];
  for (const [teamNumber, rating] of ratings) {
    const r = rec(teamNumber);
    rows.push({
      teamNumber,
      rating,
      score: conservativeScore(rating),
      wins: r.w,
      losses: r.l,
      ties: r.t,
    });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows;
}
