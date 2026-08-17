import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="sparkles" size={42} color="#fff" />
        </View>
        <Text style={styles.title}>LiFePath</Text>
        <Text style={styles.tagline}>
          Connect with mentors who guide you toward your goals.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          icon="arrow-forward"
          iconPosition="right"
          onPress={() => router.push('/(auth)/signup')}
        />
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontFamily: fonts.extraBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 24,
  },
  actions: {
    paddingBottom: spacing.xl,
  },
});

