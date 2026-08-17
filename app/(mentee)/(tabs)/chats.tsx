import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState, Screen, SectionTitle } from '@/components/ui';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/lib/theme';
import { useConversations } from '@/hooks/useConversations';

export default function MenteeChatsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const { conversations, loading, refresh } = useConversations(profile?.id ?? '', 'mentee');

  return (
    <Screen>
      <SectionTitle>My mentorships</SectionTitle>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<EmptyState message="No mentorships yet. Find a mentor to get started." />}
        renderItem={({ item }) => {
          const name = item.other_participant?.full_name ?? 'Mentor';
          return (
            <Pressable onPress={() => router.push(`/(mentee)/chat/${item.id}`)}>
              <View style={styles.row}>
                <Avatar
                  name={name}
                  userId={item.other_participant?.id}
                  avatarFileName={item.other_participant?.avatar_url}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.last_message ?? 'Start the conversation'}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  preview: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
});
