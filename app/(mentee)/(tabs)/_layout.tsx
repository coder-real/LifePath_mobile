import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

function tabIcon(label: string) {
  // Simple text-based tab icons to avoid needing an icon library.
  const glyph =
    label === 'Home' ? '⌂' : label === 'Mentors' ? '✦' : label === 'Chats' ? '✉' : label === 'Goals' ? '◎' : '●';
  return <Text style={{ fontSize: 20, color: colors.primary }}>{glyph}</Text>;
}

export default function MenteeTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => tabIcon('Home') }} />
      <Tabs.Screen name="mentors" options={{ title: 'Mentors', tabBarIcon: () => tabIcon('Mentors') }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: () => tabIcon('Chats') }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals', tabBarIcon: () => tabIcon('Goals') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => tabIcon('Profile') }} />
    </Tabs>
  );
}
