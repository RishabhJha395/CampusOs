import { supabase } from '../../../lib/supabaseClient';
import type { ChatChannel, ChatMessage } from '../types';

export const chatService = {
  async getMyChannels(_userId: string): Promise<ChatChannel[]> {
    // Let RLS automatically filter the channels we have access to
    // (This natively includes the 'Student Union' channel for students!)
    const { data: channels, error: cError } = await supabase
      .from('chat_channels')
      .select(`
        *,
        participants:chat_participants(
          *,
          profile:profiles(*)
        )
      `)
      .order('updated_at', { ascending: false });

    if (cError) throw cError;
    return channels as unknown as ChatChannel[];
  },

  async getMessages(channelId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }); // Oldest to newest for chat UI

    if (error) throw error;
    return data as unknown as ChatMessage[];
  },

  async sendMessage(channelId: string, senderId: string, content: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        content
      })
      .select(`
        *,
        sender:profiles(*)
      `)
      .single();

    if (error) throw error;
    
    // Note: The channel's updated_at timestamp is now automatically updated 
    // by a PostgreSQL trigger on the server whenever a message is inserted!
    
    return data as unknown as ChatMessage;
  },

  async editMessage(messageId: string, newContent: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ content: newContent })
      .eq('id', messageId)
      .select(`
        *,
        sender:profiles(*)
      `)
      .single();
      
    if (error) throw error;
    return data as unknown as ChatMessage;
  },

  // Helpers to start new chats
  async createDirectMessage(_collegeId: string, user1Id: string, user2Id: string): Promise<ChatChannel> {
    // Use the secure RPC that validates roles and checks for existing channels
    const { data: channelId, error: rpcError } = await supabase.rpc('create_direct_chat', {
      other_user_id: user2Id
    });
    
    if (rpcError) throw rpcError;

    // Return the newly created (or existing) channel structure
    return this.getMyChannels(user1Id).then(channels => channels.find(c => c.id === channelId)!);
  }
};
