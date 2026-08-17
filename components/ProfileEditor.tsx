import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Field } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Shared profile editor. Role-specific fields (headline, expertise for mentors)
// are rendered by the caller via `extraFields` and saved with `extraData`.
export function ProfileEditor({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [interests, setInterests] = useState(profile?.interests?.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function save() {
    if (!profile) return;
    setSaving(true);
    setFeedback('');
    const interestsList = interests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        interests: interestsList,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      setFeedback('Could not save: ' + error.message);
    } else {
      setFeedback('Saved!');
      refreshProfile();
      onSaved();
    }
  }

  return (
    <View>
      <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
      <Field
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people a little about yourself"
        multiline
      />
      <Field
        label="Interests"
        value={interests}
        onChangeText={setInterests}
        placeholder="e.g. Web Development, Career Planning"
      />
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <Button title="Save Profile" onPress={save} loading={saving} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: {
    marginTop: spacing.sm,
    color: colors.success,
    fontSize: 14,
  },
});
