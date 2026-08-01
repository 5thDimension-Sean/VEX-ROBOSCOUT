/**
 * Resolves the deduplicated set of events attended by a list of team numbers.
 * Shared by the TrueSkill and World Skills leaderboards.
 */
import { vexApi } from '../api/client';
import type { VexEvent } from '../types/vex';

export const MAX_EVENTS = 25;

export async function gatherFavoriteEvents(favorites: string[]): Promise<{
  events: VexEvent[];
  capped: boolean;
}> {
  const byId = new Map<number, VexEvent>();
  for (const number of favorites) {
    try {
      const team = await vexApi.getTeamByNumber(number);
      if (!team) continue;
      const events = await vexApi.getEvents({ teamId: team.id });
      for (const e of events) byId.set(e.id, e);
    } catch {
      // ignore a single team's failure
    }
  }
  const all = [...byId.values()];
  return { events: all.slice(0, MAX_EVENTS), capped: all.length > MAX_EVENTS };
}
