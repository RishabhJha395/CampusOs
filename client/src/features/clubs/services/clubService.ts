import { supabase } from '../../../lib/supabaseClient';

export interface Club {
  id: string;
  college_id: string;
  name: string;
  description: string;
  category: string;
  president_id: string;
  president?: {
    full_name: string;
  };
  members?: { student_id: string }[];
}

export interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  club?: Club;
}

export const clubService = {
  async getClubs(): Promise<Club[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        president:profiles!clubs_president_id_fkey(full_name),
        members:club_members(student_id)
      `)
      .order('name');
      
    if (error) throw error;
    return data as unknown as Club[];
  },

  async joinClub(clubId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('club_members')
      .insert({ club_id: clubId, student_id: studentId });
      
    if (error) throw error;
  },

  async leaveClub(clubId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('student_id', studentId);
      
    if (error) throw error;
  },

  async getUpcomingEvents(): Promise<ClubEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('club_events')
      .select(`
        *,
        club:clubs(name, category)
      `)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });
      
    if (error) throw error;
    return data as unknown as ClubEvent[];
  },

  async createEvent(event: Omit<ClubEvent, 'id' | 'club'>): Promise<void> {
    const { error } = await supabase
      .from('club_events')
      .insert(event);
      
    if (error) throw error;
  }
};
