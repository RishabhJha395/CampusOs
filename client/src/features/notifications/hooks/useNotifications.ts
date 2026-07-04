import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { supabase } from '../../../lib/supabaseClient';
import { useEffect } from 'react';

const KEYS = {
  unread: ['unread_counts'] as const,
  emergencies: ['active_emergencies'] as const,
};

export function useUnreadCounts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Generate a unique channel name to bypass React strict mode caching issues
    const channelName = `notifications_unread_${Date.now()}_${Math.random()}`;
    // Listen for new messages to invalidate unread counts
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: KEYS.unread });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: KEYS.unread,
    queryFn: () => notificationService.getUnreadCounts(),
    refetchInterval: 30000, // Poll every 30s as fallback
  });
}

export function useMarkChannelRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => notificationService.markChannelRead(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
    }
  });
}

export function useActiveEmergencies(role: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role !== 'warden' && role !== 'college_admin') return;
    
    const channelName = `notifications_emergencies_${Date.now()}_${Math.random()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: KEYS.emergencies });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [role, queryClient]);

  return useQuery({
    queryKey: KEYS.emergencies,
    queryFn: () => notificationService.getActiveEmergencies(),
    enabled: role === 'warden' || role === 'college_admin',
    refetchInterval: 30000,
  });
}
