/**
 * Global app state for the VEX app: primary team + favorited team numbers
 * (strings like "1234A"), hydrated from AsyncStorage.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import * as storage from '../services/storage';

interface AppContextValue {
  ready: boolean;
  primaryTeam: string | null;
  favorites: string[];
  setPrimaryTeam: (teamNumber: string) => Promise<void>;
  toggleFavorite: (teamNumber: string) => Promise<void>;
  isFavorite: (teamNumber: string) => boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [primaryTeam, setPrimaryTeamState] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [pt, favs] = await Promise.all([
        storage.getPrimaryTeam(),
        storage.getFavorites(),
      ]);
      setPrimaryTeamState(pt);
      setFavorites(favs);
      setReady(true);
    })();
  }, []);

  const setPrimaryTeam = useCallback(async (teamNumber: string) => {
    await storage.savePrimaryTeam(teamNumber);
    setPrimaryTeamState(teamNumber);
    setFavorites(await storage.getFavorites());
  }, []);

  const toggleFavorite = useCallback(async (teamNumber: string) => {
    setFavorites(await storage.toggleFavorite(teamNumber));
  }, []);

  const isFavorite = useCallback(
    (teamNumber: string) => favorites.includes(teamNumber),
    [favorites],
  );

  const value = useMemo<AppContextValue>(
    () => ({ ready, primaryTeam, favorites, setPrimaryTeam, toggleFavorite, isFavorite }),
    [ready, primaryTeam, favorites, setPrimaryTeam, toggleFavorite, isFavorite],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
