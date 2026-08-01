/**
 * Type definitions for the Public VEX Events API (v2), generated from the
 * official OpenAPI spec (swagger.yml). https://events.vex.com/api/v2
 *
 * Responses are paginated: { meta, data }.
 */

export interface PageMeta {
  current_page: number;
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface Paginated<T> {
  meta: PageMeta;
  data: T[];
}

/** Shared reference shape used for season/program/team/event/division refs. */
export interface IdInfo {
  id: number;
  name: string;
  code?: string | null;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface ReLocation {
  venue?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
  coordinates?: Coordinates;
}

export type EventLevel = 'World' | 'National' | 'Regional' | 'State' | 'Signature' | 'Other';
export type EventType = 'tournament' | 'league' | 'workshop' | 'virtual';
export type Grade = 'College' | 'High School' | 'Middle School' | 'Elementary School';
export type SkillType = 'driver' | 'programming' | 'package_delivery_time';

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
  season: IdInfo;
  program: IdInfo;
  location: ReLocation;
  locations?: Record<string, ReLocation>;
  divisions: Division[];
  level?: EventLevel;
  ongoing?: boolean;
  awards_finalized?: boolean;
  event_type?: EventType;
}

export interface VexTeam {
  id: number;
  number: string; // e.g. "1234A"
  team_name?: string;
  robot_name?: string;
  organization?: string;
  location?: ReLocation;
  registered?: boolean;
  program: IdInfo;
  grade?: Grade;
}

export interface AllianceTeam {
  team: IdInfo;
  sitting: boolean;
}

export interface Alliance {
  color: 'red' | 'blue';
  score: number;
  teams: AllianceTeam[];
}

export interface VexMatch {
  id: number;
  event: IdInfo;
  division: IdInfo;
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

export interface VexSkill {
  id: number;
  event: IdInfo;
  team: IdInfo;
  type: SkillType;
  season: IdInfo;
  division?: IdInfo;
  rank: number;
  score: number;
  attempts: number;
}

export interface Ranking {
  id: number;
  event: IdInfo;
  division: IdInfo;
  rank: number;
  team: IdInfo;
  wins: number;
  losses: number;
  ties: number;
  wp: number;
  ap: number;
  sp: number;
  high_score: number;
  average_points: number;
  total_points: number;
}

export interface TeamAwardWinner {
  division?: IdInfo;
  team: IdInfo;
}

export interface Award {
  id: number;
  event: IdInfo;
  order: number;
  title: string;
  qualifications: string[];
  designation: 'tournament' | 'division' | null;
  classification: 'champion' | 'finalist' | 'semifinalist' | 'quarterfinalist' | null;
  teamWinners: TeamAwardWinner[];
  individualWinners: string[];
}

export interface Season {
  id: number;
  name: string;
  program: IdInfo;
  start: string;
  end: string;
  years_start: number;
  years_end: number;
}

export interface Program {
  id: number;
  abbr: string;
  name: string;
}
