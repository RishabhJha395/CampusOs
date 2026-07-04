import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useFacultyCourses, useCourseRoster } from '../../features/academics/hooks/useAcademics';
import { BookOpen, Users, GraduationCap, CheckCircle, Clock } from 'lucide-react';

export function FacultyAcademics() {
  const { profile } = useSelector((state: RootState) => state.auth);
  
  const { data: courses, isLoading: isLoadingCourses } = useFacultyCourses(profile?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  const { data: roster, isLoading: isLoadingRoster } = useCourseRoster(selectedCourseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
            <GraduationCap className="mr-3 text-primary-600 dark:text-primary-400" />
            Faculty Hub
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your courses, attendance, and grading</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Courses</h2>
          
          {isLoadingCourses ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
            </div>
          ) : courses?.length === 0 ? (
             <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
              <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No courses assigned to you.</p>
            </div>
          ) : (
            courses?.map((course) => (
              <div 
                key={course.id} 
                onClick={() => setSelectedCourseId(course.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedCourseId === course.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm ring-1 ring-primary-500' 
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{course.name}</h3>
                </div>
                <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 space-x-3">
                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300">
                    {course.course_code}
                  </span>
                  <span className="flex items-center"><Clock size={12} className="mr-1" /> Sem {course.semester}</span>
                  <span className="flex items-center"><CheckCircle size={12} className="mr-1" /> {course.credits} Cr</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Course Details & Roster */}
        <div className="lg:col-span-2">
          {selectedCourseId ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-[600px]">
              
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Users className="mr-2 text-primary-500" size={24} />
                    Class Roster
                  </h2>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                      Mark Attendance
                    </button>
                    <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
                      Add Grades
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingRoster ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl w-full"></div>)}
                  </div>
                ) : roster?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                    <Users size={32} className="mb-3 text-gray-300 dark:text-gray-600" />
                    No students currently enrolled in this course.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Student Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster?.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold mr-3">
                                {enrollment.student?.full_name?.charAt(0) || 'S'}
                              </div>
                              {enrollment.student?.full_name}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize">
                              {enrollment.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button className="text-primary-600 dark:text-primary-400 hover:underline font-medium text-xs">
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
              <div>
                <GraduationCap className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-800 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a course</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">Choose a course from your list to view the roster and manage academics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
