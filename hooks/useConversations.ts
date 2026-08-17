import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Conversation, MentorshipRequest, Profile } from '@/types';

interface Result {
  conversations: Conversation[];
  loading: boolean;
  refresh: () => Promise<void>;
}

// Loads the current user's conversations.
// role: 'mentee' | 'mentor' controls which side of the mentorship to join on.
export function useConversations(
  userId: string,
  role: 'mentee' | 'mentor'
): Result {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // 1) Find accepted mentorships for this user.
    const req = role === 'mentee'
      ? supabase
          .from('mentorship_requests')
          .select('*, other:profiles!mentor_id(*)')
          .eq('mentee_id', userId)
          .eq('status', 'accepted')
      : supabase
          .from('mentorship_requests')
          .select('*, other:profiles!mentee_id(*)')
          .eq('mentor_id', userId)
          .eq('status', 'accepted');

    const { data: requests } = await req;
    const mentorships = (requests ?? []) as (MentorshipRequest & { other: Profile | null })[];

    if (mentorships.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // 2) Find the conversation for each accepted mentorship.
    const mentorshipIds = mentorships.map((m) => m.id);
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('mentorship_id', mentorshipIds);

    const convMap = new Map<string, Conversation>();
    for (const c of convs ?? []) {
      convMap.set(c.mentorship_id, c);
    }

    // 3) Last message preview per conversation.
    const conversationIds = [...convMap.values()].map((c) => c.id);
    let lastByConv: Record<string, string | null> = {};
    if (conversationIds.length > 0) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('conversation_id, content')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });
      for (const m of msgs ?? []) {
        if (!(m.conversation_id in lastByConv)) {
          lastByConv[m.conversation_id] = m.content;
        }
      }
    }

    // 4) Assemble list, keeping mentorship order (newest request first).
    const list: Conversation[] = mentorships
      .filter((m) => convMap.has(m.id))
      .map((m) => {
        const conv = convMap.get(m.id)!;
        return {
          ...conv,
          other_participant: m.other,
          last_message: lastByConv[conv.id] ?? null,
        };
      });

    setConversations(list);
    setLoading(false);
  }, [userId, role]);

  useEffect(() => {
    load();
  }, [load]);

  return { conversations, loading, refresh: load };
}
