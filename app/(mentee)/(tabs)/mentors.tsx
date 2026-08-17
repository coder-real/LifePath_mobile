import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, EmptyState, Screen, SectionTitle, Tag } from '@/components/ui';
import Avatar from '@/components/Avatar';
import { colors, radius, spacing } from '@/lib/theme';
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
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or headline"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />
      <View style={styles.filterRow}>
        <CategoryChip label="All" active={category === null} onPress={() => setCategory(null)} />
        {availableCategories.map((c) => (
          <CategoryChip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </View>

      <FlatList
        data={mentors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          loading ? null : <EmptyState message="No mentors match your search yet." />
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
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.headline}>{item.headline ?? 'Mentor'}</Text>
                  </View>
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

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View
      onTouchEnd={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
  card: {
    paddingVertical: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  cardFooter: {
    marginTop: spacing.sm,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
