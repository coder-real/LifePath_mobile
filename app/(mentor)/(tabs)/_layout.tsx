import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

function tabIcon(label: string) {
  const glyph =
    label === 'Home' ? '⌂' : label === 'Requests' ? '✉' : label === 'Mentees' ? '◎' : '●';
  return <Text style={{ fontSize: 20, color: colors.primary }}>{glyph}</Text>;
}

export default function MentorTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => tabIcon('Home') }} />
      <Tabs.Screen name="requests" options={{ title: 'Requests', tabBarIcon: () => tabIcon('Requests') }} />
      <Tabs.Screen name="mentees" options={{ title: 'Mentees', tabBarIcon: () => tabIcon('Mentees') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => tabIcon('Profile') }} />
    </Tabs>
  );
}
