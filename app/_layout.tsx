import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
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
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
