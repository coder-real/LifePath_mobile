import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, Screen, SelectableChip } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Goal, GoalMilestone } from '@/types';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState('');
  const [adding, setAdding] = useState(false);

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

  async function addMilestone() {
    const title = newMilestone.trim();
    if (!title || !goal || adding) return;
    setAdding(true);
    const { error } = await supabase.from('goal_milestones').insert({
      goal_id: goal.id,
      title,
      is_completed: false,
    });
    setAdding(false);
    if (!error) {
      setNewMilestone('');
      load();
    }
  }

  async function setStatus(status: Goal['status']) {
    if (!goal || status === goal.status) return;
    const { error } = await supabase
      .from('goals')
      .update({ status })
      .eq('id', goal.id);
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
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            {(['active', 'paused', 'completed'] as const).map((s) => {
              const isActive = goal.status === s;
              return (
                <SelectableChip
                  key={s}
                  label={s.charAt(0).toUpperCase() + s.slice(1)}
                  active={isActive}
                  onPress={() => setStatus(s)}
                  style={styles.statusChip}
                />
              );
            })}
          </View>

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
          <EmptyState message="This goal has no milestones yet. Add one below." />
        ) : (
          milestones.map((m) => (
            <View key={m.id} style={styles.milestone}>
              <Pressable onPress={() => toggle(m)} style={styles.checkbox}>
                {m.is_completed ? <Text style={styles.check}>{'✓'}</Text> : null}
              </Pressable>
              <Text style={[styles.milestoneText, m.is_completed && styles.milestoneDone]}>
                {m.title}
              </Text>
              {updating === m.id ? <Text style={styles.updating}>…</Text> : null}
            </View>
          ))
        )}

        <View style={styles.addRow}>
          <TextInput
            value={newMilestone}
            onChangeText={setNewMilestone}
            placeholder="Add a milestone…"
            placeholderTextColor={colors.textMuted}
            style={styles.addInput}
            onSubmitEditing={addMilestone}
          />
          <Pressable onPress={addMilestone} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{adding ? '…' : 'Add'}</Text>
          </Pressable>
        </View>

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
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    flex: 1,
    marginRight: spacing.xs,
    marginBottom: 0,
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
