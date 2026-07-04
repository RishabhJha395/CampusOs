import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useStudentEnrollments, useStudentGrades } from '../../features/academics/hooks/useAcademics';
import { BookOpen, Award, GraduationCap, ChevronRight, User } from 'lucide-react';

export function StudentAcademics() {
  const { profile } = useSelector((state: RootState) => state.auth);
  
  const { data: enrollments, isLoading } = useStudentEnrollments(profile?.id || '');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

  // Auto-select first course when loaded
  if (enrollments && enrollments.length > 0 && !selectedEnrollmentId) {
    setSelectedEnrollmentId(enrollments[0].id);
  }

  const { data: grades, isLoading: isLoadingGrades } = useStudentGrades(selectedEnrollmentId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
            <BookOpen className="mr-3 text-primary-600 dark:text-primary-400" />
            My Academics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your enrolled courses and grades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Course List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white px-1">Enrolled Courses</h2>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>)}
            </div>
          ) : enrollments?.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Not enrolled in any courses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments?.map((enrollment) => (
                <div 
                  key={enrollment.id} 
                  onClick={() => setSelectedEnrollmentId(enrollment.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    selectedEnrollmentId === enrollment.id 
                      ? 'border-primary-500 bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div>
                    <h3 className="font-bold line-clamp-1">{enrollment.course?.name}</h3>
                    <p className={`text-xs mt-1 font-medium ${selectedEnrollmentId === enrollment.id ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {enrollment.course?.course_code} • {enrollment.course?.credits} Credits
                    </p>
                  </div>
                  <ChevronRight size={20} className={selectedEnrollmentId === enrollment.id ? 'text-white' : 'text-gray-300 dark:text-gray-700 group-hover:text-primary-500'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Course Details & Grades */}
        <div className="lg:col-span-2">
          {selectedEnrollmentId ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              
              {/* Active Course Header */}
              {enrollments?.map(e => e.id === selectedEnrollmentId && (
                <div key={e.id} className="p-8 border-b border-gray-100 dark:border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary-50 dark:bg-primary-900/20 rounded-full blur-2xl"></div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">{e.course?.name}</h2>
                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 relative z-10">
                    <span className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg font-medium">
                      {e.course?.course_code}
                    </span>
                    <span className="flex items-center">
                      <User size={16} className="mr-2" />
                      {e.course?.faculty?.full_name || 'No assigned faculty'}
                    </span>
                  </div>
                </div>
              ))}

              <div className="p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
                  <Award className="mr-2 text-primary-500" size={20} />
                  Grades & Assessments
                </h3>

                {isLoadingGrades ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800 rounded-xl w-full"></div>)}
                  </div>
                ) : grades?.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
                    <Award size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No grades posted yet for this course.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grades?.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-md transition-shadow group">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {grade.assessment_name}
                          </h4>
                          {grade.feedback && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md line-clamp-2">
                              "{grade.feedback}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Posted {new Date(grade.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {grade.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
              <p className="text-gray-500 dark:text-gray-400">Select a course to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
