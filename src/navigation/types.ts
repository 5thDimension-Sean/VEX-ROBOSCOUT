import type { NavigatorScreenParams } from '@react-navigation/native';

export type LookupSubTab = 'teams' | 'events';

export type TabParamList = {
  Favorites: undefined;
  TrueSkill: undefined;
  Lookup: { initialSubTab?: LookupSubTab } | undefined;
  WorldSkills: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  TeamDetail: { teamNumber: string };
  EventDetail: { eventId: number; eventName: string; divisions: number[] };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
