import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, EmptyState, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { MentorshipRequest } from '@/types';

export default function RequestsScreen() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      (async () => {
        if (!profile) return;
        const { data } = await supabase
          .from('mentorship_requests')
          .select('*, mentee:profiles!mentee_id(*)')
          .eq('mentor_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (active) {
          setRequests((data ?? []) as MentorshipRequest[]);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [profile])
  );

  async function respond(id: string, accept: boolean) {
    setBusy(id);
    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', id);

    if (!error && accept) {
      // Create a conversation for the accepted mentorship.
      await supabase.from('conversations').insert({ mentorship_id: id });
    }
    setBusy(null);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <Screen>
      <SectionTitle>Mentorship requests</SectionTitle>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<EmptyState message="No pending requests right now." />}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.mentee?.full_name ?? 'Mentee'}</Text>
            {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
            <View style={styles.actions}>
              <Button title="Accept" onPress={() => respond(item.id, true)} loading={busy === item.id} style={{ flex: 1 }} />
              <Button title="Reject" variant="danger" onPress={() => respond(item.id, false)} loading={busy === item.id} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
