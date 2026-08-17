import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Screen, SectionTitle, Tag } from '@/components/ui';
import { ProfileEditor } from '@/components/ProfileEditor';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';

export default function MenteeProfileScreen() {
  const { profile, signOut } = useAuth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.role}>Mentee</Text>
        </View>

        <SectionTitle>Your info</SectionTitle>
        <View style={styles.infoCard}>
          <Text style={styles.label}>Bio</Text>
          <Text style={styles.text}>{profile?.bio || 'No bio yet.'}</Text>
          <Text style={styles.label}>Interests</Text>
          <View style={styles.tags}>
            {(profile?.interests ?? []).length === 0 ? (
              <Text style={styles.text}>None yet.</Text>
            ) : (
              (profile?.interests ?? []).map((i) => <Tag key={i} label={i} />)
            )}
          </View>
        </View>

        <SectionTitle>Edit profile</SectionTitle>
        <ProfileEditor onSaved={() => {}} />

        <Button title="Log Out" variant="danger" onPress={signOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  role: {
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  text: {
    fontSize: 15,
    color: colors.text,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
});
