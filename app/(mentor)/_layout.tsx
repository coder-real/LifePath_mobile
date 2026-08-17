import React from 'react';
import { Stack } from 'expo-router';
import { colors, fonts } from '@/lib/theme';

export default function MentorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: fonts.bold,
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Chat' }} />
    </Stack>
  );
}

