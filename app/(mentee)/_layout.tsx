import { Stack } from 'expo-router';

export default function MenteeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mentor/[id]" options={{ headerShown: true, title: 'Mentor' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Chat' }} />
      <Stack.Screen name="goal/[id]" options={{ headerShown: true, title: 'Goal' }} />
      <Stack.Screen name="new-goal" options={{ headerShown: true, title: 'New Goal' }} />
    </Stack>
  );
}
