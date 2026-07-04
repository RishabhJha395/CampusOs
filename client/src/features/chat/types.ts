import type { Profile } from '../auth/types';

export interface ChatChannel {
  id: string;
  college_id: string;
  name: string | null;
  type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  
  // Joined
  participants?: ChatParticipant[];
  latest_message?: ChatMessage;
}

export interface ChatParticipant {
  id: string;
  channel_id: string;
  user_id: string;
  last_read_at: string;
  
  // Joined
  profile?: Profile;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  is_edited?: boolean;
  
  // Joined
  sender?: Profile;
}
