import { Stack } from 'expo-router';

export default function MentorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Chat' }} />
    </Stack>
  );
}
