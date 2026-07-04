import { supabase } from '../../../lib/supabaseClient';
import type { Profile } from '../../auth/types';

export interface LinkedStudent extends Profile {
  hostel_id?: string | null;
  room_id?: string | null;
}

export const parentService = {
  async getLinkedStudents(parentId: string): Promise<LinkedStudent[]> {
    // parent_student_links joins parents to students
    const { data, error } = await supabase
      .from('parent_student_links')
      .select(`
        student_id,
        students (
          hostel_id,
          room_id,
          profiles (*)
        )
      `)
      .eq('parent_id', parentId)
      .eq('status', 'active');

    if (error) throw error;
    
    // Transform data to a flat structure
    return data.map((link: any) => {
      // In case students is an array (PostgREST array vs single object mapping)
      const studentData = Array.isArray(link.students) ? link.students[0] : link.students;
      const profileData = Array.isArray(studentData?.profiles) ? studentData.profiles[0] : studentData?.profiles;

      return {
        ...profileData,
        hostel_id: studentData?.hostel_id,
        room_id: studentData?.room_id,
      };
    });
  }
};
