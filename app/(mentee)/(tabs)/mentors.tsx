import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Screen, SectionTitle, SelectableChip, Tag } from '@/components/ui';
import Avatar from '@/components/Avatar';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, MentorProfile } from '@/types';

export default function MentorListScreen() {
  const router = useRouter();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      (async () => {
        let req = supabase
          .from('mentor_profiles')
          .select('*, profile:profiles(*)')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (query.trim()) {
          req = req.or(`profile.full_name.ilike.%${query}%,headline.ilike.%${query}%`);
        }
        if (category) {
          req = req.contains('categories', [category]);
        }

        const { data } = await req;
        if (active) {
          setMentors((data ?? []) as MentorProfile[]);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [query, category])
  );

  const availableCategories = CATEGORIES;

  return (
    <Screen>
      <SectionTitle>Find a mentor</SectionTitle>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or headline"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        <SelectableChip
          label="All"
          icon="grid-outline"
          active={category === null}
          onPress={() => setCategory(null)}
        />
        {availableCategories.map((c) => (
          <SelectableChip
            key={c}
            label={c}
            active={category === c}
            onPress={() => setCategory(category === c ? null : c)}
          />
        ))}
      </View>

      <FlatList
        data={mentors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="search-outline"
              message="No mentors match your search yet. Try adjusting your filters."
            />
          )
        }
        renderItem={({ item }) => {
          const name = item.profile?.full_name ?? 'Mentor';
          return (
            <Pressable onPress={() => router.push(`/(mentee)/mentor/${item.id}`)}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Avatar
                    name={name}
                    userId={item.profile?.id}
                    avatarFileName={item.profile?.avatar_url}
                    size={52}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.headline} numberOfLines={2}>
                      {item.headline ?? 'Mentor'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.tags}>
                  {(item.categories ?? []).map((cat) => (
                    <Tag key={cat} label={cat} />
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  clearBtn: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
  },
  search: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: 42,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.regular,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.sm,
  },
  card: {
    paddingVertical: spacing.md,
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  headline: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
});

