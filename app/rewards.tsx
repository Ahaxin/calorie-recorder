import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format, subDays, parseISO } from 'date-fns';
import { useTheme } from '../lib/theme';
import { useRewardsStore } from '../stores/rewards-store';

// ─── helpers ───────────────────────────────────────────────────────────────────

function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Build an array of the last `count` date strings, newest last. */
function lastNDates(count: number): string[] {
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    result.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return result;
}

/** Parse 'sun_2024-04' → 'April 2024' */
function parseSunBadgeLabel(badge: string): string {
  const yearMonth = badge.slice(4); // '2024-04'
  const [year, month] = yearMonth.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return format(d, 'MMMM yyyy');
}

function badgeLabel(badge: string): string {
  if (badge === '7star') return '7-Day Champion';
  if (badge.startsWith('sun_')) return `Monthly Sun — ${parseSunBadgeLabel(badge)}`;
  return badge;
}

function badgeIcon(badge: string): string {
  if (badge === '7star') return '🏆';
  if (badge.startsWith('sun_')) return '☀️';
  return '🎖️';
}

// ─── sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}

function StatCard({ value, label, colors }: StatCardProps): React.JSX.Element {
  return (
    <View style={[statCardStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[statCardStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[statCardStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  value: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 4, fontWeight: '500' },
});

// ─── main screen ───────────────────────────────────────────────────────────────

export default function RewardsScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { rewards, loading, loadRewards, useCheatDay } = useRewardsStore();
  const today = todayString();

  useEffect(() => {
    const unsubscribe = loadRewards();
    return unsubscribe;
  }, []);

  const handleUseCheatDay = useCallback(async (): Promise<void> => {
    try {
      await useCheatDay(today);
      Alert.alert('Cheat Day Used!', 'A star has been awarded for today.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Cannot Use Cheat Day', msg);
    }
  }, [useCheatDay, today]);

  const streak = rewards?.streak ?? 0;
  const totalStars = rewards?.totalStars ?? 0;
  const badges = rewards?.badges ?? [];
  const starsByDate = rewards?.starsByDate ?? {};

  // Determine whether cheat day is available this week
  const weeklyCheatUsed = rewards?.weeklyCheatUsed ?? false;
  const weeklyCheatResetDate = rewards?.weeklyCheatResetDate ?? '';
  // Compute last Monday
  const d = new Date();
  const dayOfWeek = d.getDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = format(subDays(d, daysFromMonday), 'yyyy-MM-dd');
  const cheatAvailable = !weeklyCheatUsed || weeklyCheatResetDate < lastMonday;

  const calendarDates = lastNDates(30);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rewards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            value={streak > 0 ? `${streak}` : '0'}
            label={streak === 1 ? '🔥 Day Streak' : '🔥 Day Streak'}
            colors={colors}
          />
          <View style={styles.statGap} />
          <StatCard
            value={totalStars}
            label="⭐ Total Stars"
            colors={colors}
          />
        </View>

        {/* Badges section */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges</Text>
            {badges.map((badge) => (
              <View
                key={badge}
                style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={styles.badgeIcon}>{badgeIcon(badge)}</Text>
                <Text style={[styles.badgeLabel, { color: colors.text }]}>{badgeLabel(badge)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cheat day section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Cheat Day</Text>
          <View style={[styles.cheatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cheatInfo}>
              <Text style={[styles.cheatTitle, { color: colors.text }]}>
                {cheatAvailable ? 'Available this week' : 'Used this week'}
              </Text>
              <Text style={[styles.cheatSubtitle, { color: colors.textSecondary }]}>
                {cheatAvailable
                  ? 'Use it to earn a star even if you go over your goal today.'
                  : 'Resets every Monday.'}
              </Text>
            </View>
            {cheatAvailable ? (
              <TouchableOpacity
                onPress={handleUseCheatDay}
                activeOpacity={0.8}
                style={[styles.cheatButton, { backgroundColor: colors.secondary }]}
              >
                <Text style={styles.cheatButtonText}>Use Today</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.cheatButton, { backgroundColor: colors.disabled }]}>
                <Text style={[styles.cheatButtonText, { color: colors.textSecondary }]}>
                  Used
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Calendar star grid — last 30 days */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Last 30 Days</Text>
          <View style={[styles.calendarGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {calendarDates.map((dateStr) => {
              const isToday = dateStr === today;
              const hasStar = starsByDate[dateStr] === true;
              const dayNum = parseInt(dateStr.slice(8, 10), 10);

              return (
                <View
                  key={dateStr}
                  style={[
                    styles.calCell,
                    {
                      borderColor: isToday ? colors.primary : 'transparent',
                      backgroundColor: isToday
                        ? `${colors.primary}18`
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.calDay,
                      { color: isToday ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  <Text style={styles.calIcon}>{hasStar ? '⭐' : '·'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CAL_CELL_SIZE = 40;

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { paddingVertical: 4, paddingHorizontal: 4, minWidth: 60 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  headerSpacer: { minWidth: 60 },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 24 },
  statGap: { width: 12 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },

  // Badge cards
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeIcon: { fontSize: 24 },
  badgeLabel: { fontSize: 15, fontWeight: '600' },

  // Cheat card
  cheatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cheatInfo: { flex: 1 },
  cheatTitle: { fontSize: 14, fontWeight: '600' },
  cheatSubtitle: { fontSize: 12, marginTop: 2 },
  cheatButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheatButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 4,
  },
  calCell: {
    width: CAL_CELL_SIZE,
    height: CAL_CELL_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDay: { fontSize: 10, fontWeight: '600', lineHeight: 12 },
  calIcon: { fontSize: 12, lineHeight: 14 },
});
