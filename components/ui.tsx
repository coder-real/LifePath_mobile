import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// ---- Button ----
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.surface
      : variant === 'danger'
      ? colors.danger
      : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#fff'
      : variant === 'secondary'
      ? colors.primary
      : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: variant === 'secondary' ? colors.primaryLight : 'transparent',
          borderWidth: variant === 'secondary' ? 1.5 : 0,
        },
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 6 }} />
          ) : null}
          <Text style={[styles.buttonText, { color: textColor }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={18} color={textColor} style={{ marginLeft: 6 }} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

// ---- Text input field ----
export function Field({
  label,
  icon,
  style,
  ...props
}: TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: TextStyle;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon ? (
          <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.inputIcon} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, icon ? { paddingLeft: 40 } : null, style]}
          {...props}
        />
      </View>
    </View>
  );
}

// ---- Card ----
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---- Section title ----
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

// ---- Empty state ----
export function EmptyState({
  message,
  icon = 'file-tray-outline',
}: {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ---- Tag / chip ----
export function Tag({
  label,
  icon,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.tag}>
      {icon ? (
        <Ionicons name={icon} size={12} color={colors.primary} style={{ marginRight: 4 }} />
      ) : null}
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// ---- Selectable chip (works on web + native) ----
export function SelectableChip({
  label,
  active,
  onPress,
  icon,
  style,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectableChip,
        active && styles.selectableChipActive,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon ? (
          <Ionicons
            name={icon}
            size={14}
            color={active ? '#fff' : colors.textMuted}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Text style={[styles.selectableChipText, active && styles.selectableChipTextActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ---- Screen container ----
export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  fieldGroup: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.regular,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.medium,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  selectableChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectableChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectableChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  selectableChipTextActive: {
    color: '#fff',
    fontFamily: fonts.semiBold,
  },
});

