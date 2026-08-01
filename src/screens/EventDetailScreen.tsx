import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme/theme';
import { vexApi } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { Card } from '../components/Card';
import { Loading, ErrorView, EmptyView } from '../components/StateView';
import type { VexMatch } from '../types/vex';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;
type SectionKey = 'teams' | 'matches';
type MatchFilter = 'all' | 'qual' | 'elim';

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId, divisions } = route.params;
  const { palette } = useTheme();
  const [section, setSection] = useState<SectionKey>('teams');

  const teams = useAsync(() => vexApi.getEventTeams(eventId), [eventId]);
  const matches = useAsync(() => vexApi.getEventMatches(eventId, divisions), [eventId]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={styles.segment}>
        <Seg label="Teams" active={section === 'teams'} onPress={() => setSection('teams')} />
        <Seg label="Matches" active={section === 'matches'} onPress={() => setSection('matches')} />
      </View>

      {section === 'teams' ? (
        teams.loading ? (
          <Loading />
        ) : teams.error ? (
          <ErrorView message={teams.error} onRetry={teams.reload} />
        ) : (teams.data ?? []).length === 0 ? (
          <EmptyView icon="people-outline" message="No teams registered yet." />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            {(teams.data ?? []).map((t) => (
              <Card
                key={t.id}
                onPress={() => navigation.navigate('TeamDetail', { teamNumber: t.number })}
                style={styles.teamRow}
              >
                <Text style={{ ...typography.label, color: palette.primary, width: 72 }}>{t.number}</Text>
                <Text style={{ ...typography.body, color: palette.text, flex: 1 }} numberOfLines={1}>
                  {t.team_name}
                </Text>
              </Card>
            ))}
          </ScrollView>
        )
      ) : (
        <MatchesSection
          matches={matches.data ?? []}
          loading={matches.loading}
          error={matches.error}
          onRetry={matches.reload}
          onTeam={(n) => navigation.navigate('TeamDetail', { teamNumber: n })}
        />
      )}
    </View>
  );
}

function MatchesSection({
  matches,
  loading,
  error,
  onRetry,
  onTeam,
}: {
  matches: VexMatch[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onTeam: (n: string) => void;
}) {
  const { palette } = useTheme();
  const [filter, setFilter] = useState<MatchFilter>('all');

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={onRetry} />;

  const filtered = matches.filter((m) => {
    if (filter === 'qual') return m.round === 2;
    if (filter === 'elim') return m.round >= 3;
    return true;
  });

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.filterRow}>
        {(['all', 'qual', 'elim'] as MatchFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, { backgroundColor: filter === f ? palette.primary : palette.surfaceAlt, borderColor: palette.border }]}
          >
            <Text style={{ ...typography.caption, color: filter === f ? palette.primaryText : palette.textMuted, textTransform: 'capitalize' }}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyView icon="grid-outline" message="No matches in this category yet." />
      ) : (
        filtered
          .sort((a, b) => a.round - b.round || a.instance - b.instance || a.matchnum - b.matchnum)
          .map((m) => <MatchRow key={m.id} match={m} onTeam={onTeam} />)
      )}
    </ScrollView>
  );
}

function MatchRow({ match, onTeam }: { match: VexMatch; onTeam: (n: string) => void }) {
  const { palette } = useTheme();
  const red = match.alliances.find((a) => a.color === 'red');
  const blue = match.alliances.find((a) => a.color === 'blue');
  const played = match.scored;
  const redWon = played && (red?.score ?? 0) > (blue?.score ?? 0);
  const blueWon = played && (blue?.score ?? 0) > (red?.score ?? 0);

  return (
    <Card style={styles.matchCard}>
      <Text style={{ ...typography.caption, color: palette.textMuted, marginBottom: spacing.xs }}>
        {match.name}
      </Text>
      <AllianceRow
        color={palette.red}
        teams={red?.teams.map((t) => t.team.name) ?? []}
        score={red?.score ?? null}
        won={redWon}
        played={played}
        onTeam={onTeam}
      />
      <AllianceRow
        color={palette.blue}
        teams={blue?.teams.map((t) => t.team.name) ?? []}
        score={blue?.score ?? null}
        won={blueWon}
        played={played}
        onTeam={onTeam}
      />
    </Card>
  );
}

function AllianceRow({
  color,
  teams,
  score,
  won,
  played,
  onTeam,
}: {
  color: string;
  teams: string[];
  score: number | null;
  won: boolean;
  played: boolean;
  onTeam: (n: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.allianceRow}>
      <View style={[styles.allianceDot, { backgroundColor: color }]} />
      <View style={{ flex: 1, flexDirection: 'row', gap: spacing.md }}>
        {teams.length === 0 ? (
          <Text style={{ ...typography.body, color: palette.textMuted }}>—</Text>
        ) : (
          teams.map((n) => (
            <Pressable key={n} onPress={() => onTeam(n)} hitSlop={6}>
              <Text style={{ ...typography.body, color: palette.text }}>{n}</Text>
            </Pressable>
          ))
        )}
      </View>
      <Text
        style={{
          ...typography.h3,
          color: played ? (won ? palette.text : palette.textMuted) : palette.textMuted,
          fontWeight: won ? '800' : '600',
        }}
      >
        {played ? score : '–'}
      </Text>
    </View>
  );
}

function Seg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.seg, { borderBottomColor: active ? palette.primary : 'transparent' }]}>
      <Text style={{ ...typography.label, color: active ? palette.primary : palette.textMuted }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', paddingHorizontal: spacing.lg },
  seg: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 2 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  matchCard: {},
  allianceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  allianceDot: { width: 10, height: 10, borderRadius: 5 },
});
