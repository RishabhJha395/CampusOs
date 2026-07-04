import type { Profile } from '../auth/types';

export interface Course {
  id: string;
  college_id: string;
  department_id: string;
  faculty_id: string | null;
  course_code: string;
  name: string;
  credits: number;
  semester: number;
  
  // Joined fields
  faculty?: Profile;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: 'active' | 'completed' | 'dropped';
  
  // Joined fields
  course?: Course;
  student?: Profile;
}

export interface Grade {
  id: string;
  enrollment_id: string;
  assessment_name: string;
  grade: string;
  feedback: string | null;
  graded_by: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  enrollment_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}
