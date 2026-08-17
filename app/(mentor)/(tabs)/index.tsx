import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function MentorHomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [mentees, setMentees] = useState<{ id: string; full_name: string | null }[]>([]);
  const [profileReady, setProfileReady] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!profile) return;
        // Check whether this mentor has set up their public mentor profile.
        const { data: mp } = await supabase
          .from('mentor_profiles')
          .select('id')
          .eq('id', profile.id)
          .maybeSingle();
        if (active) setProfileReady(!!mp);

        const { count } = await supabase
          .from('mentorship_requests')
          .select('*', { count: 'exact', head: true })
          .eq('mentor_id', profile.id)
          .eq('status', 'pending');
        if (active) setPending(count ?? 0);

        const { data } = await supabase
          .from('mentorship_requests')
          .select('mentee:profiles!mentee_id(id, full_name)')
          .eq('mentor_id', profile.id)
          .eq('status', 'accepted');
        const list = ((data ?? []) as unknown as {
          mentee: { id: string; full_name: string | null } | null;
        }[])
          .map((r) => r.mentee)
          .filter(Boolean) as { id: string; full_name: string | null }[];
        if (active) setMentees(list);
      })();
      return () => {
        active = false;
      };
    }, [profile])
  );

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Screen>
      <Text style={styles.greeting}>Welcome, {firstName} 👋</Text>

      {profileReady === false ? (
        <Card style={styles.onboarding}>
          <Text style={styles.onboardingTitle}>Set up your mentor profile</Text>
          <Text style={styles.onboardingText}>
            You haven't created your public mentor profile yet, so you won't appear in mentor
            search. Add your headline, expertise, and categories to get started.
          </Text>
          <Button title="Set Up Mentor Profile" onPress={() => router.push('/(mentor)/(tabs)/profile')} />
        </Card>
      ) : null}

      <Card style={styles.statCard}>
        <Text style={styles.statNumber}>{pending}</Text>
        <Text style={styles.statLabel}>Pending requests</Text>
      </Card>

      <SectionTitle>Active mentees</SectionTitle>
      {mentees.length === 0 ? (
        <Card>
          <Text style={styles.muted}>No active mentees yet.</Text>
        </Card>
      ) : (
        mentees.map((m) => (
          <Card key={m.id}>
            <Text style={styles.menteeName}>{m.full_name}</Text>
          </Card>
        ))
      )}

      <SectionTitle>Actions</SectionTitle>
      <Button title="View Requests" onPress={() => router.push('/(mentor)/(tabs)/requests')} />
      <Button title="Open Mentees" variant="secondary" onPress={() => router.push('/(mentor)/(tabs)/mentees')} />
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
  statCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  onboarding: {
    backgroundColor: colors.primary + '0d',
    borderColor: colors.primary + '33',
    marginTop: spacing.md,
  },
  onboardingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  onboardingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  statNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  menteeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
