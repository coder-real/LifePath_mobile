import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Field, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/types';

export default function MentorProfileScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [headline, setHeadline] = useState('');
  const [expertise, setExpertise] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle();
      if (data) {
        setHeadline(data.headline ?? '');
        setExpertise((data.expertise ?? []).join(', '));
        setCategories(data.categories ?? []);
        setIsAvailable(data.is_available ?? true);
      }
    })();
  }, [profile]);

  function toggleCategory(c: string) {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setFeedback('');
    const expertiseList = expertise.split(',').map((s) => s.trim()).filter(Boolean);
    const row = {
      id: profile.id,
      headline: headline.trim() || null,
      expertise: expertiseList,
      categories,
      is_available: isAvailable,
    };
    // Upsert so a first-time setup creates the row.
    const { error } = await supabase.from('mentor_profiles').upsert(row);
    setSaving(false);
    if (error) {
      setFeedback('Could not save: ' + error.message);
    } else {
      setFeedback('Profile saved! You now appear in mentor search.');
      refreshProfile();
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <SectionTitle>Mentor profile</SectionTitle>
        <Field
          label="Headline"
          value={headline}
          onChangeText={setHeadline}
          placeholder="e.g. Software Engineer with 5 years experience"
        />
        <Field
          label="Expertise"
          value={expertise}
          onChangeText={setExpertise}
          placeholder="e.g. Web Development, Career Planning"
        />

        <Text style={styles.label}>Categories</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <View
              key={c}
              onTouchEnd={() => toggleCategory(c)}
              style={[styles.chip, categories.includes(c) && styles.chipActive]}
            >
              <Text style={[styles.chipText, categories.includes(c) && styles.chipTextActive]}>
                {c}
              </Text>
            </View>
          ))}
        </View>

        <View onTouchEnd={() => setIsAvailable((v) => !v)} style={styles.availability}>
          <View style={[styles.switch, isAvailable && styles.switchOn]}>
            <View style={[styles.switchKnob, isAvailable && styles.switchKnobOn]} />
          </View>
          <Text style={styles.availabilityText}>
            {isAvailable ? 'Available for new mentees' : 'Not accepting new mentees'}
          </Text>
        </View>

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <Button title="Save Mentor Profile" onPress={save} loading={saving} style={{ marginTop: spacing.md }} />

        <SectionTitle>Account</SectionTitle>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Button title="Log Out" variant="danger" onPress={signOut} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </Screen>
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
  availability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 2,
  },
  switchOn: {
    backgroundColor: colors.success,
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#fff',
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  availabilityText: {
    fontSize: 15,
    color: colors.text,
  },
  feedback: {
    marginTop: spacing.sm,
    color: colors.success,
    fontSize: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
