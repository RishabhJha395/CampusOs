import { supabase } from '../../../lib/supabaseClient';
import type { Course, Enrollment, Grade } from '../types';

export const academicService = {
  // For Faculty
  async getFacultyCourses(facultyId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('faculty_id', facultyId)
      .is('deleted_at', null)
      .order('course_code');
    if (error) throw error;
    return data as unknown as Course[];
  },

  async getCourseRoster(courseId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        student:profiles!course_enrollments_student_id_fkey(*)
      `)
      .eq('course_id', courseId)
      .eq('status', 'active');
    if (error) throw error;
    return data as unknown as Enrollment[];
  },

  // For Students
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(
          *, 
          faculty (
            profiles (*)
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');
      
    if (error) throw error;
    
    // Map the nested faculty profile to course.faculty so the UI can access course.faculty.full_name
    return data.map((d: any) => {
       const facultyRecord = Array.isArray(d.course?.faculty) ? d.course.faculty[0] : d.course?.faculty;
       const profile = Array.isArray(facultyRecord?.profiles) ? facultyRecord.profiles[0] : facultyRecord?.profiles;
       
       return {
          ...d,
          course: {
             ...d.course,
             faculty: profile
          }
       };
    }) as unknown as Enrollment[];
  },

  async getStudentGrades(enrollmentId: string): Promise<Grade[]> {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Grade[];
  }
};
