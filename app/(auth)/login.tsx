import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Screen } from '@/components/ui';
import { colors, fonts, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    }
    // On success the protected route logic in _layout redirects to the right home.
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <Screen>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to continue to LiFePath.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
          placeholder="Your password"
        />

        <Button
          title="Log In"
          icon="log-in-outline"
          onPress={handleLogin}
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
});

