import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Tag } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { MentorProfile } from '@/types';

export default function MentorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: me } = useAuth();
  const router = useRouter();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('mentor_profiles')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .single();
      setMentor((data as MentorProfile) ?? null);
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!me) return;
      const { data } = await supabase
        .from('mentorship_requests')
        .select('id')
        .eq('mentee_id', me.id)
        .eq('mentor_id', id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();
      setAlreadyRequested(!!data);
    })();
  }, [me, id]);

  async function sendRequest() {
    if (!me) return;
    setSending(true);
    setFeedback('');
    const { error } = await supabase.from('mentorship_requests').insert({
      mentee_id: me.id,
      mentor_id: id,
      message: message.trim() || null,
      status: 'pending',
    });
    setSending(false);
    if (error) {
      setFeedback('Could not send request: ' + error.message);
    } else {
      setFeedback('Request sent! Your mentor can now accept or reject it.');
      setAlreadyRequested(true);
    }
  }

  if (!mentor) {
    return (
      <Screen>
        <Text style={styles.muted}>Loading mentor…</Text>
      </Screen>
    );
  }

  const name = mentor.profile?.full_name ?? 'Mentor';

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.headline}>{mentor.headline ?? ''}</Text>
        </View>

        <Section label="Bio">
          <Text style={styles.text}>{mentor.profile?.bio || 'No bio yet.'}</Text>
        </Section>

        <Section label="Expertise">
          <View style={styles.tags}>
            {(mentor.expertise ?? []).map((e) => (
              <Tag key={e} label={e} />
            ))}
          </View>
        </Section>

        <Section label="Categories">
          <View style={styles.tags}>
            {(mentor.categories ?? []).map((c) => (
              <Tag key={c} label={c} />
            ))}
          </View>
        </Section>

        <Card style={styles.requestCard}>
          <Text style={styles.sectionTitle}>Send a mentorship request</Text>
          {alreadyRequested ? (
            <Text style={styles.successText}>You've already sent a request to this mentor.</Text>
          ) : (
            <>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell your mentor what you'd like help with…"
                placeholderTextColor={colors.textMuted}
                multiline
                style={styles.messageInput}
              />
              <Button title="Send Request" onPress={sendRequest} loading={sending} />
            </>
          )}
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </Card>

        <Button title="Back to mentors" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>{label}</Text>
      {children}
    </Card>
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  headline: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requestCard: {
    marginTop: spacing.md,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    fontSize: 15,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  successText: {
    color: colors.success,
    fontSize: 15,
  },
  feedback: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
