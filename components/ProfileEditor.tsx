import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Field } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { profileAvatarUrl, uploadAvatar } from '@/lib/avatar';

// Shared profile editor (used by the mentee profile screen).
// Includes avatar upload to Supabase Storage.
export function ProfileEditor({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [interests, setInterests] = useState(profile?.interests?.join(', ') ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

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
    const interestsList = interests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

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

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        interests: interestsList,
        avatar_url: avatarFileName,
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

  const currentAvatarUri = avatarUri ?? profileAvatarUrl(profile?.id ?? '', profile?.avatar_url ?? null);

  return (
    <View>
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          {currentAvatarUri ? (
            <Image source={{ uri: currentAvatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {(fullName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Button title={avatarUri ? 'Change photo' : 'Upload photo'} variant="secondary" onPress={pickAvatar} style={styles.avatarBtn} />
      </View>

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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.primary,
  },
  avatarBtn: {
    flex: 1,
    marginVertical: 0,
  },
});
