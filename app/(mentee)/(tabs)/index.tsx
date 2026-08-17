import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Goal } from '@/types';

export default function MenteeHomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!profile) return;
        const { data } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .in('status', ['active', 'paused'])
          .order('created_at', { ascending: false })
          .limit(3);
        if (active) setGoals(data ?? []);
      })();
      return () => {
        active = false;
      };
    }, [profile])
  );

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi {firstName} 👋</Text>
        <Text style={styles.subtitle}>Here's where you are on your path.</Text>
      </View>

      <SectionTitle
        action={
          goals.length > 0 ? (
            <Pressable onPress={() => router.push('/(mentee)/(tabs)/goals')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          ) : undefined
        }
      >
        Active goals
      </SectionTitle>

      {goals.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="flag-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No active goals yet</Text>
          <Text style={styles.emptyText}>Create your first goal to begin tracking your milestones.</Text>
          <Button
            title="Create a goal"
            icon="add-outline"
            onPress={() => router.push('/(mentee)/new-goal')}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        goals.map((g) => (
          <Pressable key={g.id} onPress={() => router.push(`/(mentee)/goal/${g.id}`)}>
            <Card style={styles.goalCard}>
              <View style={styles.goalRow}>
                <View style={styles.goalIconWrap}>
                  <Ionicons name="flag" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalCategory}>{g.category ?? 'General'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        ))
      )}

      <SectionTitle>Take a step</SectionTitle>
      <Button
        title="Find a Mentor"
        icon="compass-outline"
        onPress={() => router.push('/(mentee)/(tabs)/mentors')}
      />
      <Button
        title="View all goals"
        icon="list-outline"
        variant="secondary"
        onPress={() => router.push('/(mentee)/(tabs)/goals')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  goalCard: {
    paddingVertical: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  goalCategory: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
});

