import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme/theme';
import { vexApi } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { Card } from '../components/Card';
import { StarButton } from '../components/StarButton';
import { Loading, ErrorView } from '../components/StateView';
import type { VexEvent } from '../types/vex';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamDetail'>;

export function TeamDetailScreen({ route, navigation }: Props) {
  const { teamNumber } = route.params;
  const { palette } = useTheme();

  const team = useAsync(() => vexApi.getTeamByNumber(teamNumber), [teamNumber]);
  const events = useAsync(async () => {
    const t = await vexApi.getTeamByNumber(teamNumber);
    return t ? vexApi.getEvents({ teamId: t.id }) : [];
  }, [teamNumber]);

  if (team.loading) return <Loading label={`Loading ${teamNumber}…`} />;
  if (team.error) return <ErrorView message={team.error} onRetry={team.reload} />;
  if (!team.data) return <ErrorView message={`Team ${teamNumber} not found this season.`} />;

  const t = team.data;
  const now = Date.now();
  const list = events.data ?? [];
  const upcoming = list.filter((e) => new Date(e.end).getTime() >= now);
  const past = list.filter((e) => new Date(e.end).getTime() < now);
  const loc = t.location;

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.number, { color: palette.primary }]}>{t.number}</Text>
            <Text style={[styles.name, { color: palette.text }]}>{t.team_name}</Text>
          </View>
          <StarButton teamNumber={t.number} size={28} />
        </View>
        <InfoRow icon="business-outline" label="Organization" value={t.organization} />
        <InfoRow
          icon="location-outline"
          label="Location"
          value={[loc?.city, loc?.region, loc?.country].filter(Boolean).join(', ')}
        />
        {t.robot_name ? (
          <InfoRow icon="hardware-chip-outline" label="Robot" value={t.robot_name} />
        ) : null}
        <InfoRow icon="school-outline" label="Grade" value={t.grade} />
      </Card>

      <SectionTitle>TrueSkill & World Skills</SectionTitle>
      <Card>
        <Text style={{ color: palette.textMuted, ...typography.body, lineHeight: 21 }}>
          See this team ranked by Bayesian TrueSkill on the TrueSkill tab and by
          combined driver + programming score on the World Skills tab.
        </Text>
      </Card>

      <SectionTitle>Upcoming Events ({upcoming.length})</SectionTitle>
      {events.loading ? (
        <Card><Text style={{ color: palette.textMuted }}>Loading events…</Text></Card>
      ) : upcoming.length === 0 ? (
        <Card><Text style={{ color: palette.textMuted }}>No upcoming events.</Text></Card>
      ) : (
        upcoming.map((e) => <EventRow key={e.id} event={e} onPress={() => go(navigation, e)} />)
      )}

      <SectionTitle>Past Events ({past.length})</SectionTitle>
      {past.length === 0 ? (
        <Card><Text style={{ color: palette.textMuted }}>No past events.</Text></Card>
      ) : (
        past.map((e) => <EventRow key={e.id} event={e} onPress={() => go(navigation, e)} />)
      )}
    </ScrollView>
  );
}

function go(navigation: Props['navigation'], e: VexEvent) {
  navigation.navigate('EventDetail', {
    eventId: e.id,
    eventName: e.name,
    divisions: e.divisions.map((d) => d.id),
  });
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { palette } = useTheme();
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={palette.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: palette.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return <Text style={[styles.sectionTitle, { color: palette.text }]}>{children}</Text>;
}

function EventRow({ event, onPress }: { event: VexEvent; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Card onPress={onPress} style={styles.eventRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eventName, { color: palette.text }]} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={{ color: palette.textMuted, ...typography.caption }}>
          {[event.location?.city, event.location?.region].filter(Boolean).join(', ')} ·{' '}
          {formatDate(event.start)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  number: { ...typography.h2 },
  name: { ...typography.h3, marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginTop: spacing.md },
  infoLabel: { ...typography.caption },
  infoValue: { ...typography.body },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eventName: { ...typography.label },
});
