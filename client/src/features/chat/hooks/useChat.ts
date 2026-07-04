import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { supabase } from '../../../lib/supabaseClient';
import { useEffect } from 'react';

export const CHAT_KEYS = {
  myChannels: (userId: string) => ['chat_channels', userId] as const,
  messages: (channelId: string) => ['chat_messages', channelId] as const,
};

export function useMyChannels(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Listen to changes on chat_channels so we reorder when updated_at changes
    const channelName = `chat_channels_order_${userId}_${Date.now()}_${Math.random()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_channels' },
        () => {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.myChannels(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: CHAT_KEYS.myChannels(userId),
    queryFn: () => chatService.getMyChannels(userId),
    enabled: !!userId,
  });
}

export function useMessages(channelId: string | null) {
  const queryClient = useQueryClient();

  // Set up real-time subscription for this channel
  useEffect(() => {
    if (!channelId) return;

    const channelName = `chat_messages_${channelId}_${Date.now()}_${Math.random()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          console.log("Realtime event received:", payload);
          // Invalidate to fetch the new/updated message along with its joined sender profile
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(channelId) });
        }
      )
      .subscribe((status) => {
         console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channelId, queryClient]);

  return useQuery({
    queryKey: CHAT_KEYS.messages(channelId!),
    queryFn: () => chatService.getMessages(channelId!),
    enabled: !!channelId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, senderId, content }: { channelId: string, senderId: string, content: string }) => 
      chatService.sendMessage(channelId, senderId, content),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(vars.channelId) });
      // The sendMessage RPC updates the chat_channels.updated_at timestamp.
      // This will trigger the realtime UPDATE listener in useMyChannels automatically!
    }
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, newContent }: { messageId: string, newContent: string, channelId: string }) => 
      chatService.editMessage(messageId, newContent),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(vars.channelId) });
    }
  });
}

export function useCreateDirectMessage() {
  return useMutation({
    mutationFn: ({ collegeId, myId, otherId }: { collegeId: string, myId: string, otherId: string }) => 
      chatService.createDirectMessage(collegeId, myId, otherId),
  });
}
