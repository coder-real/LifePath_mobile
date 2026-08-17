import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Screen } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/lib/theme';
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
    if (data.user) {
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role,
        bio: null,
        interests: [],
      });
      if (profileErr) {
        console.warn('Profile upsert error:', profileErr.message);
      }
    }

    setLoading(false);

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

        <Field
          label="Full name"
          icon="person-outline"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ada Lovelace"
        />
        <Field
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
        />

        <Text style={styles.roleLabel}>I am signing up as a…</Text>
        <View style={styles.roleRow}>
          <RoleChip
            active={role === 'mentee'}
            label="Mentee"
            icon="school-outline"
            onPress={() => setRole('mentee')}
          />
          <RoleChip
            active={role === 'mentor'}
            label="Mentor"
            icon="ribbon-outline"
            onPress={() => setRole('mentor')}
          />
        </View>

        <Button
          title="Create Account"
          icon="checkmark-outline"
          onPress={handleSignUp}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        />
        <Button
          title="Back"
          icon="arrow-back-outline"
          variant="ghost"
          onPress={() => router.back()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function RoleChip({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon?: 'school-outline' | 'ribbon-outline';
  onPress: () => void;
}) {
  return (
    <Button
      title={label}
      icon={icon}
      variant={active ? 'primary' : 'secondary'}
      onPress={onPress}
      style={styles.roleChip}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontFamily: fonts.extraBold,
    color: colors.text,
    marginTop: spacing.xl,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  roleLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
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

