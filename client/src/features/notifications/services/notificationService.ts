import { supabase } from '../../../lib/supabaseClient';

export interface UnreadCount {
  channel_id: string;
  unread_count: number;
}

export const notificationService = {
  async getUnreadCounts(): Promise<UnreadCount[]> {
    const { data, error } = await supabase.rpc('get_unread_counts');
    if (error) throw error;
    return data as unknown as UnreadCount[];
  },

  async markChannelRead(channelId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_channel_read', { p_channel_id: channelId });
    if (error) throw error;
  },

  async getActiveEmergencies(): Promise<any[]> {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select(`
        *,
        student:students!emergency_alerts_student_id_fkey(
          profile:profiles(*)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching emergencies:", error);
      throw error;
    }
    return data || [];
  }
};
