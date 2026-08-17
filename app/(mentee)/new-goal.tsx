import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/types';

export default function NewGoalScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Academic');
  const [milestone, setMilestone] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addMilestone() {
    const m = milestone.trim();
    if (!m) return;
    setMilestones((prev) => [...prev, m]);
    setMilestone('');
  }

  async function save() {
    setError('');
    if (!title.trim()) {
      setError('Please give your goal a title.');
      return;
    }
    if (!profile) return;
    setSaving(true);

    const { data: goal, error: goalErr } = await supabase
      .from('goals')
      .insert({
        user_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        status: 'active',
      })
      .select()
      .single();

    if (goalErr) {
      setError(goalErr.message);
      setSaving(false);
      return;
    }

    if (milestones.length > 0) {
      const rows = milestones.map((m) => ({ goal_id: goal.id, title: m, is_completed: false }));
      await supabase.from('goal_milestones').insert(rows);
    }

    setSaving(false);
    router.replace(`/(mentee)/goal/${goal.id}`);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Field label="Goal title" value={title} onChangeText={setTitle} placeholder="e.g. Learn React basics" />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What does success look like?"
          multiline
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <View
              key={c}
              onTouchEnd={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Milestones (optional)</Text>
        <View style={styles.milestoneRow}>
          <TextInput
            value={milestone}
            onChangeText={setMilestone}
            placeholder="e.g. Finish first tutorial"
            placeholderTextColor={colors.textMuted}
            style={styles.milestoneInput}
            onSubmitEditing={addMilestone}
          />
          <View onTouchEnd={addMilestone} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add</Text>
          </View>
        </View>
        {milestones.map((m, i) => (
          <Text key={i} style={styles.milestoneItem}>• {m}</Text>
        ))}

        <Button title="Save Goal" onPress={save} loading={saving} style={{ marginTop: spacing.lg }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  milestoneInput: {
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
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  milestoneItem: {
    color: colors.text,
    fontSize: 15,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
});
