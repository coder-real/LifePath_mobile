import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Role } from '@/types';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mentee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    setError('');
    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    // Create the profile row (id mirrors auth.users.id).
    // Use an upsert so it's safe even though a DB trigger also auto-creates
    // the row on signup — whichever runs first, this never errors.
    if (data.user) {
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role,
        bio: null,
        interests: [],
      });
      if (profileErr) {
        // Non-fatal: profile may already exist if a user signs up with email
        // confirmation flow. Log it but continue.
        console.warn('Profile upsert error:', profileErr.message);
      }
    }

    setLoading(false);

    // With email confirmation disabled, the session is live and the router
    // will redirect. With it enabled, tell the user to confirm.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setError('Check your email to confirm your account, then log in.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <Screen>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join LiFePath as a mentee or a mentor.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ada Lovelace" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
        />

        <Text style={styles.roleLabel}>I am signing up as a…</Text>
        <View style={styles.roleRow}>
          <RoleChip active={role === 'mentee'} label="Mentee" onPress={() => setRole('mentee')} />
          <RoleChip active={role === 'mentor'} label="Mentor" onPress={() => setRole('mentor')} />
        </View>

        <Button title="Create Account" onPress={handleSignUp} loading={loading} style={{ marginTop: spacing.lg }} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function RoleChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      title={label}
      variant={active ? 'primary' : 'secondary'}
      onPress={onPress}
      style={styles.roleChip}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  roleChip: {
    flex: 1,
    borderRadius: radius.md,
  },
});
