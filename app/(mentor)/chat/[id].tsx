import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '@/components/ChatScreen';

export default function MentorChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen conversationId={id} />;
}
