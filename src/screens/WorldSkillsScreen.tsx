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
import { computeSkills, type SkillsRow } from '../services/skills';
import { gatherFavoriteEvents } from '../services/favoriteEvents';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * World Skills Ranking — ranks teams by combined driver + programming skills
 * score (each team's best of each), aggregated across your favorited teams'
 * events. This mirrors the VEX World Skills standings metric.
 */
export function WorldSkillsScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation<Nav>();
  const { favorites, isFavorite } = useApp();

  const [rows, setRows] = useState<SkillsRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setRows(null);
    try {
      const { events } = await gatherFavoriteEvents(favorites);
      if (events.length === 0) {
        setRows([]);
        return;
      }
      const board = await computeSkills(events, (done, total) => setProgress({ done, total }));
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
      <Loading label={progress ? `Reading skills… ${progress.done}/${progress.total}` : 'Gathering events…'} />
    );
  }
  if (error) return <ErrorView message={error} onRetry={run} />;

  if (rows == null) {
    return (
      <Screen>
        <View style={styles.intro}>
          <Ionicons name="trophy-outline" size={40} color={palette.primary} />
          <Text style={{ ...typography.h2, color: palette.text, textAlign: 'center' }}>
            World Skills Ranking
          </Text>
          <Text style={{ ...typography.body, color: palette.textMuted, textAlign: 'center', lineHeight: 21 }}>
            Teams ranked by combined driver + programming skills score (best of
            each), across your favorited teams' events.
          </Text>
          <Pressable
            onPress={run}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="calculator-outline" size={18} color={palette.primaryText} />
            <Text style={{ ...typography.label, color: palette.primaryText }}>Compute skills</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (rows.length === 0) {
    return <EmptyView icon="trophy-outline" message="No skills results found for your teams' events yet." />;
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
              {rows.length} teams · driver + programming
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
                Driver {item.driver} · Prog {item.programming}
              </Text>
            </View>
            <Text style={{ ...typography.h3, color: palette.primary }}>{item.combined}</Text>
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
