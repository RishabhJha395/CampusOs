import { useQuery } from '@tanstack/react-query';
import { academicService } from '../services/academicService';

const KEYS = {
  facultyCourses: (facultyId: string) => ['faculty_courses', facultyId] as const,
  courseRoster: (courseId: string) => ['course_roster', courseId] as const,
  studentEnrollments: (studentId: string) => ['student_enrollments', studentId] as const,
  studentGrades: (enrollmentId: string) => ['student_grades', enrollmentId] as const,
};

export function useFacultyCourses(facultyId: string) {
  return useQuery({
    queryKey: KEYS.facultyCourses(facultyId),
    queryFn: () => academicService.getFacultyCourses(facultyId),
    enabled: !!facultyId,
  });
}

export function useCourseRoster(courseId: string | null) {
  return useQuery({
    queryKey: KEYS.courseRoster(courseId!),
    queryFn: () => academicService.getCourseRoster(courseId!),
    enabled: !!courseId,
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery({
    queryKey: KEYS.studentEnrollments(studentId),
    queryFn: () => academicService.getStudentEnrollments(studentId),
    enabled: !!studentId,
  });
}

export function useStudentGrades(enrollmentId: string | null) {
  return useQuery({
    queryKey: KEYS.studentGrades(enrollmentId!),
    queryFn: () => academicService.getStudentGrades(enrollmentId!),
    enabled: !!enrollmentId,
  });
}
