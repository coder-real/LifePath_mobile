import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

// A single chat screen shared by mentee and mentor routes.
export default function ChatScreen({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    const content = draft.trim();
    if (!content || sending || !user) return;
    setSending(true);
    setSendError('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      setSendError('Could not send message: ' + error.message);
    } else {
      setDraft('');
      load();
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello! 👋</Text>}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirRow]}>
              <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirBubble]}>
                <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.inputBarWrap}>
        {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (sendError) setSendError('');
            }}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
          />
          <PressableButton label="Send" onPress={send} loading={sending} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function PressableButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.sendButton} disabled={loading}>
      {loading ? (
        <Ionicons name="hourglass-outline" size={20} color="#fff" />
      ) : (
        <Ionicons name="send" size={18} color="#fff" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: spacing.xl,
  },
  bubbleRow: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  mineBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 21,
  },
  mineText: {
    color: '#fff',
  },
  inputBarWrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendError: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
