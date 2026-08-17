import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, EmptyState, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Goal } from '@/types';

export default function GoalsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('goals')
      .select('*, milestones:goal_milestones(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setGoals((data ?? []) as Goal[]);
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <SectionTitle>My goals</SectionTitle>
      <Button title="+ New Goal" onPress={() => router.push('/(mentee)/new-goal')} />
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<EmptyState message="No goals yet. Create your first goal to get started." />}
        renderItem={({ item }) => {
          const milestones = item.milestones ?? [];
          const total = milestones.length;
          const done = milestones.filter((m) => m.is_completed).length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <Pressable onPress={() => router.push(`/(mentee)/goal/${item.id}`)}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.status}>{item.status}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {total === 0 ? 'Add milestones' : `${done}/${total} milestones · ${pct}%`}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressText: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
});
