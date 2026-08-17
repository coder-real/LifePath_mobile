import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/lib/theme';
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
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {firstName} 👋</Text>
      </View>

      {profileReady === false ? (
        <Card style={styles.onboarding}>
          <View style={styles.onboardingIconRow}>
            <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.onboardingTitle}>Set up your mentor profile</Text>
          <Text style={styles.onboardingText}>
            You haven't created your public mentor profile yet, so you won't appear in mentor
            search. Add your headline, expertise, and categories to get started.
          </Text>
          <Button
            title="Set Up Mentor Profile"
            icon="arrow-forward-outline"
            iconPosition="right"
            onPress={() => router.push('/(mentor)/(tabs)/profile')}
          />
        </Card>
      ) : null}

      <Card style={styles.statCard}>
        <View style={styles.statIconWrap}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
        </View>
        <Text style={styles.statNumber}>{pending}</Text>
        <Text style={styles.statLabel}>Pending requests</Text>
        {pending > 0 ? (
          <Button
            title="Review"
            icon="chevron-forward"
            iconPosition="right"
            variant="secondary"
            onPress={() => router.push('/(mentor)/(tabs)/requests')}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </Card>

      <SectionTitle>Active mentees</SectionTitle>
      {mentees.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyText}>No active mentees yet.</Text>
        </Card>
      ) : (
        mentees.map((m) => (
          <Card key={m.id} style={styles.menteeCard}>
            <View style={styles.menteeRow}>
              <View style={styles.menteeAvatar}>
                <Text style={styles.menteeInitial}>
                  {(m.full_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.menteeName}>{m.full_name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))
      )}

      <SectionTitle>Actions</SectionTitle>
      <Button
        title="View Requests"
        icon="notifications-outline"
        onPress={() => router.push('/(mentor)/(tabs)/requests')}
      />
      <Button
        title="Open Mentees"
        icon="people-outline"
        variant="secondary"
        onPress={() => router.push('/(mentor)/(tabs)/mentees')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  onboarding: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '33',
    marginTop: spacing.md,
  },
  onboardingIconRow: {
    marginBottom: spacing.xs,
  },
  onboardingTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  onboardingText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  statNumber: {
    fontSize: 40,
    fontFamily: fonts.extraBold,
    color: colors.primary,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  menteeCard: {
    paddingVertical: spacing.sm,
  },
  menteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menteeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menteeInitial: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  menteeName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
});


