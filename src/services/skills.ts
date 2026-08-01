/**
 * World Skills leaderboard, aggregated from event skills results across a
 * bounded set of events. Each team's best driver score and best programming
 * score are summed into a combined skills score (the VEX World Skills metric).
 */
import { vexApi } from '../api/client';
import type { VexEvent } from '../types/vex';

export interface SkillsRow {
  teamNumber: string;
  driver: number;
  programming: number;
  combined: number;
  events: number;
}

export async function computeSkills(
  events: VexEvent[],
  onProgress?: (done: number, total: number) => void,
): Promise<SkillsRow[]> {
  // Track best driver + best programming per team across all events.
  const best = new Map<string, { driver: number; programming: number; events: Set<number> }>();

  let done = 0;
  for (const event of events) {
    try {
      const skills = await vexApi.getEventSkills(event.id);
      for (const s of skills) {
        const key = s.team.name;
        if (!key) continue;
        const cur = best.get(key) ?? { driver: 0, programming: 0, events: new Set<number>() };
        if (s.type === 'driver') cur.driver = Math.max(cur.driver, s.score);
        else if (s.type === 'programming') cur.programming = Math.max(cur.programming, s.score);
        cur.events.add(event.id);
        best.set(key, cur);
      }
    } catch {
      // skip failed events
    }
    done += 1;
    onProgress?.(done, events.length);
  }

  const rows: SkillsRow[] = [];
  for (const [teamNumber, v] of best) {
    rows.push({
      teamNumber,
      driver: v.driver,
      programming: v.programming,
      combined: v.driver + v.programming,
      events: v.events.size,
    });
  }
  rows.sort((a, b) => b.combined - a.combined);
  return rows;
}
