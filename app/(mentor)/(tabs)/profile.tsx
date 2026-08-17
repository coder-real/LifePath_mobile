import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Field, Screen, SectionTitle } from '@/components/ui';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { profileAvatarUrl, uploadAvatar } from '@/lib/avatar';
import { CATEGORIES } from '@/types';

export default function MentorProfileScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [headline, setHeadline] = useState('');
  const [expertise, setExpertise] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
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

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFeedback('We need media library permission to upload an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setFeedback('');
    }
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setFeedback('');
    const expertiseList = expertise.split(',').map((s) => s.trim()).filter(Boolean);

    // Upload avatar first if the user picked a new one.
    let avatarFileName: string | null = profile.avatar_url;
    if (avatarUri) {
      try {
        const mime = avatarUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        avatarFileName = await uploadAvatar(profile.id, { uri: avatarUri, mimeType: mime });
      } catch (e) {
        setSaving(false);
        setFeedback('Avatar upload failed: ' + (e instanceof Error ? e.message : String(e)));
        return;
      }
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarFileName })
      .eq('id', profile.id);
    if (profileErr) {
      setSaving(false);
      setFeedback('Could not save avatar: ' + profileErr.message);
      return;
    }

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

        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Avatar
                name={profile?.full_name ?? '?'}
                userId={profile?.id}
                avatarFileName={profile?.avatar_url}
                size={80}
              />
            )}
          </View>
          <Button
            title={avatarUri ? 'Change photo' : 'Upload photo'}
            variant="secondary"
            onPress={pickAvatar}
            style={styles.avatarBtn}
          />
        </View>

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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
  },
  avatarBtn: {
    flex: 1,
    marginVertical: 0,
  },
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
