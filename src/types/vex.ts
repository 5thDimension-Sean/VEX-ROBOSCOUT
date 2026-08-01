/**
 * Type definitions for the RobotEvents API (v2) as used by the VEX app.
 * https://www.robotevents.com/api/v2
 *
 * Responses are paginated: { meta, data }.
 */

export interface Paginated<T> {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
  };
  data: T[];
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface ReLocation {
  venue: string | null;
  address_1: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  country: string | null;
  coordinates: Coordinates | null;
}

export interface ProgramRef {
  id: number;
  name: string;
  code: string;
}

export interface SeasonRef {
  id: number;
  name: string;
  code: string | null;
}

export interface VexTeam {
  id: number;
  number: string; // e.g. "1234A"
  team_name: string;
  robot_name: string | null;
  organization: string;
  location: ReLocation;
  registered: boolean;
  program: ProgramRef;
  grade: string;
}

export interface Division {
  id: number;
  name: string;
  order: number;
}

export interface VexEvent {
  id: number;
  sku: string;
  name: string;
  start: string;
  end: string;
  season: SeasonRef;
  program: ProgramRef;
  location: ReLocation;
  divisions: Division[];
  level: string;
  ongoing: boolean;
}

export interface AllianceTeam {
  team: { id: number; name: string };
  sitting: boolean;
}

export interface Alliance {
  color: 'red' | 'blue';
  score: number;
  teams: AllianceTeam[];
}

export interface VexMatch {
  id: number;
  round: number;
  instance: number;
  matchnum: number;
  scheduled: string | null;
  started: string | null;
  field: string | null;
  scored: boolean;
  name: string;
  alliances: Alliance[];
}

export type SkillType = 'driver' | 'programming';

export interface VexSkill {
  id: number;
  type: SkillType;
  rank: number;
  score: number;
  attempts: number;
  team: { id: number; name: string };
}

export interface Season {
  id: number;
  name: string;
  program: ProgramRef;
  start: string;
  end: string;
}
