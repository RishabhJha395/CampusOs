import { supabase } from '../../../lib/supabaseClient';
import type { Hostel, Room, CreateHostelDTO, CreateRoomDTO } from '../types';
import type { Profile } from '../../auth/types';

export const hostelService = {
  // Hostels
  async getHostels(collegeId: string): Promise<Hostel[]> {
    const { data, error } = await supabase
      .from('hostels')
      .select('*')
      .eq('college_id', collegeId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createHostel(payload: CreateHostelDTO): Promise<Hostel> {
    const { data, error } = await supabase.from('hostels').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  // Rooms
  async getRooms(hostelId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hostel_id', hostelId)
      .is('deleted_at', null)
      .order('room_number');
    if (error) throw error;
    return data || [];
  },

  async createRoom(payload: CreateRoomDTO): Promise<Room> {
    const { data, error } = await supabase.from('rooms').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  // Roommates
  async getRoommates(roomId: string, currentUserId: string): Promise<Profile[]> {
    // 1. Get student IDs in this room
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('room_id', roomId)
      .neq('id', currentUserId)
      .is('deleted_at', null);

    if (studentError) throw studentError;
    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.id);

    // 2. Fetch their profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', studentIds);

    if (profileError) throw profileError;
    return profiles || [];
  },

  // Warden specific
  async getWardenHostel(wardenId: string): Promise<Hostel | null> {
    // Check wardens table first as it's the primary mapping
    const { data: wardenRecord } = await supabase
      .from('wardens')
      .select('hostel_id')
      .eq('id', wardenId)
      .maybeSingle();

    let hostelId = wardenRecord?.hostel_id;

    if (hostelId) {
      const { data } = await supabase
        .from('hostels')
        .select('*')
        .eq('id', hostelId)
        .maybeSingle();
      return data || null;
    } else {
      // Fallback: Check if hostels table has warden_id set directly
      const { data } = await supabase
        .from('hostels')
        .select('*')
        .eq('warden_id', wardenId)
        .maybeSingle();
        
      return data || null;
    }
  },

  async getHostelStudents(hostelId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        room_id,
        profiles (*),
        rooms (room_number),
        parent_student_links (
          status,
          parents ( profiles (*) )
        )
      `)
      .eq('hostel_id', hostelId)
      .is('deleted_at', null);
      
    if (error) {
      console.error("getHostelStudents error:", error);
      throw error;
    }
    return data || [];
  }
};
