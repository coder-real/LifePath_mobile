import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/lib/theme';

// Redirect based on auth + role. If not signed in, go to the auth group.
// If signed in, send the user to their role's home screen.
function useProtectedRoute() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationTargeted = useRef(false);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Signed out -> auth screens.
      if (!inAuthGroup) {
        navigationTargeted.current = true;
        router.replace('/(auth)/welcome');
      }
      return;
    }

    // Signed in. Show a temporary splash/loader until the profile has loaded
    // so we can route to the right home.
    if (!profile) return;

    const role = profile.role;
    const inMenteeGroup = segments[0] === '(mentee)';
    const inMentorGroup = segments[0] === '(mentor)';

    if ((role === 'mentee' && !inMenteeGroup) || (role === 'mentor' && !inMentorGroup)) {
      navigationTargeted.current = true;
      router.replace(role === 'mentee' ? '/(mentee)' : '/(mentor)');
    }
  }, [session, profile, loading, segments, router]);

  return null;
}

function RootNavigator() {
  const { loading } = useAuth();
  useProtectedRoute();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(mentee)" />
      <Stack.Screen name="(mentor)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

