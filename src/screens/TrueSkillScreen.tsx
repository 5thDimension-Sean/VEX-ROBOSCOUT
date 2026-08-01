import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Loading, ErrorView, EmptyView } from '../components/StateView';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography, radius } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { computeLeaderboard, type TeamRating } from '../services/ratings';
import { gatherFavoriteEvents } from '../services/favoriteEvents';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TrueSkillScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation<Nav>();
  const { favorites, isFavorite } = useApp();

  const [rows, setRows] = useState<TeamRating[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [capped, setCapped] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setRows(null);
    setProgress(null);
    try {
      const { events, capped: cap } = await gatherFavoriteEvents(favorites);
      setCapped(cap);
      if (events.length === 0) {
        setRows([]);
        return;
      }
      const board = await computeLeaderboard(events, (done, total) => setProgress({ done, total }));
      setRows(board);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  if (loading) {
    return (
      <Loading
        label={progress ? `Rating events… ${progress.done}/${progress.total}` : 'Gathering events…'}
      />
    );
  }
  if (error) return <ErrorView message={error} onRetry={run} />;

  if (rows == null) {
    return (
      <Screen>
        <View style={styles.intro}>
          <Ionicons name="podium-outline" size={40} color={palette.primary} />
          <Text style={{ ...typography.h2, color: palette.text, textAlign: 'center' }}>
            TrueSkill Rankings
          </Text>
          <Text style={{ ...typography.body, color: palette.textMuted, textAlign: 'center', lineHeight: 21 }}>
            Bayesian skill ratings (μ − 3σ) from real match results across the
            events your {favorites.length} favorited team
            {favorites.length === 1 ? '' : 's'} attend.
          </Text>
          <Pressable
            onPress={run}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="calculator-outline" size={18} color={palette.primaryText} />
            <Text style={{ ...typography.label, color: palette.primaryText }}>Compute rankings</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (rows.length === 0) {
    return <EmptyView icon="podium-outline" message="No completed matches found for your teams' events yet." />;
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.teamNumber}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={{ ...typography.caption, color: palette.textMuted }}>
              {rows.length} teams · μ − 3σ{capped ? ' · capped at 25 events' : ''}
            </Text>
            <Pressable onPress={run} hitSlop={8}>
              <Ionicons name="refresh" size={20} color={palette.primary} />
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <Card
            onPress={() => navigation.navigate('TeamDetail', { teamNumber: item.teamNumber })}
            style={[styles.row, isFavorite(item.teamNumber) ? { borderColor: palette.star, borderWidth: 1.5 } : null]}
          >
            <Text style={{ ...typography.h3, color: palette.textMuted, width: 34 }}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.label, color: palette.text }}>{item.teamNumber}</Text>
              <Text style={{ ...typography.caption, color: palette.textMuted }}>
                {item.wins}–{item.losses}–{item.ties} · μ {item.rating.mu.toFixed(1)} σ {item.rating.sigma.toFixed(1)}
              </Text>
            </View>
            <Text style={{ ...typography.h3, color: palette.primary }}>{item.score.toFixed(1)}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
