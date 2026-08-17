import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState, Screen, SectionTitle } from '@/components/ui';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useConversations } from '@/hooks/useConversations';

export default function MenteesScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const { conversations, loading, refresh } = useConversations(profile?.id ?? '', 'mentor');

  return (
    <Screen>
      <SectionTitle>My mentees</SectionTitle>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<EmptyState message="You have no active mentees yet." />}
        renderItem={({ item }) => {
          const name = item.other_participant?.full_name ?? 'Mentee';
          return (
            <Pressable onPress={() => router.push(`/(mentor)/chat/${item.id}`)}>
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
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  preview: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
});
