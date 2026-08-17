import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/lib/theme';
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
      <Text style={styles.greeting}>Hi {firstName} 👋</Text>
      <Text style={styles.subtitle}>Here's where you are on your path.</Text>

      <SectionTitle>Active goals</SectionTitle>
      {goals.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No active goals yet.</Text>
          <Button title="Create a goal" onPress={() => router.push('/(mentee)/new-goal')} style={{ marginTop: spacing.sm }} />
        </Card>
      ) : (
        goals.map((g) => (
          <Card key={g.id} style={styles.goalCard}>
            <Text style={styles.goalTitle}>{g.title}</Text>
            <Text style={styles.goalCategory}>{g.category ?? 'General'}</Text>
          </Card>
        ))
      )}

      <SectionTitle>Take a step</SectionTitle>
      <Button title="Find a Mentor" onPress={() => router.push('/(mentee)/(tabs)/mentors')} />
      <Button title="View all goals" variant="secondary" onPress={() => router.push('/(mentee)/(tabs)/goals')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  goalCard: {
    paddingVertical: spacing.md,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  goalCategory: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
