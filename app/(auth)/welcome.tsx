import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>L</Text>
        </View>
        <Text style={styles.title}>LiFePath</Text>
        <Text style={styles.tagline}>
          Connect with mentors who guide you toward your goals.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Get Started" onPress={() => router.push('/(auth)/signup')} />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  actions: {
    paddingBottom: spacing.xl,
  },
});
