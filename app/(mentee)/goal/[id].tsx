import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Goal, GoalMilestone } from '@/types';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const { data } = await supabase
      .from('goals')
      .select('*, milestones:goal_milestones(*)')
      .eq('id', id)
      .single();
    setGoal((data as Goal) ?? null);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function toggle(milestone: GoalMilestone) {
    if (!goal) return;
    setUpdating(milestone.id);
    const next = !milestone.is_completed;
    const { error } = await supabase
      .from('goal_milestones')
      .update({
        is_completed: next,
        completed_at: next ? new Date().toISOString() : null,
      })
      .eq('id', milestone.id);
    setUpdating(null);
    if (!error) load();
  }

  if (!goal) {
    return (
      <Screen>
        <Text style={styles.muted}>Loading…</Text>
      </Screen>
    );
  }

  const milestones = goal.milestones ?? [];
  const done = milestones.filter((m) => m.is_completed).length;
  const pct = milestones.length === 0 ? 0 : Math.round((done / milestones.length) * 100);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.meta}>{goal.category ?? 'General'} · {goal.status}</Text>
        {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {milestones.length === 0 ? 'No milestones yet.' : `${done}/${milestones.length} · ${pct}%`}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Milestones</Text>
        {milestones.length === 0 ? (
          <EmptyState message="This goal has no milestones. Check them off as you go (add them from the edit form)." />
        ) : (
          milestones.map((m) => (
            <View key={m.id} style={styles.milestone}>
              <View onTouchEnd={() => toggle(m)} style={styles.checkbox}>
                {m.is_completed ? <Text style={styles.check}>{'✓'}</Text> : null}
              </View>
              <Text style={[styles.milestoneText, m.is_completed && styles.milestoneDone]}>
                {m.title}
              </Text>
              {updating === m.id ? <Text style={styles.updating}>…</Text> : null}
            </View>
          ))
        )}

        <Button title="Refresh" variant="secondary" onPress={load} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginVertical: spacing.sm,
  },
  progressTrack: {
    height: 8,
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
    fontSize: 13,
    color: colors.textMuted,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  milestoneText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  milestoneDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  updating: {
    color: colors.textMuted,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
