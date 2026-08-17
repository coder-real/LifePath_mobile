import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';
import { profileAvatarUrl } from '@/lib/avatar';

// Circular avatar. Shows the user's uploaded image when available,
// otherwise falls back to their initial on a colored background.
export default function Avatar({
  name,
  userId,
  avatarFileName,
  size = 48,
}: {
  name: string;
  userId?: string;
  avatarFileName?: string | null;
  size?: number;
}) {
  const uri = userId && avatarFileName ? profileAvatarUrl(userId, avatarFileName) : null;
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityLabel={name}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
