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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!profile) return;
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
