import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useLinkedStudents } from '../../features/parents/hooks/useParents';
import { useStudentEnrollments, useStudentGrades } from '../../features/academics/hooks/useAcademics';
import { useMyAlerts, useCreateAlert } from '../../features/emergency/hooks/useEmergency';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, BookOpen, User, Building, MapPin, Award, AlertTriangle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ParentDashboard() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  // 1. Fetch Linked Students
  const { data: students, isLoading: isLoadingStudents } = useLinkedStudents(profile?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Auto-select first child
  if (students && students.length > 0 && !selectedStudentId) {
    setSelectedStudentId(students[0].id);
  }

  const selectedStudent = students?.find(s => s.id === selectedStudentId);

  // 2. Fetch Academics for selected student
  const { data: enrollments, isLoading: isLoadingAcademics } = useStudentEnrollments(selectedStudentId || '');
  
  // To keep it simple, just fetch grades for the first enrollment to show recent activity
  const { data: recentGrades } = useStudentGrades(enrollments?.[0]?.id || null);

  // 3. Fetch Hostel details for selected student
  const { data: accommodation } = useQuery({
    queryKey: ['parent-hostel-view', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudent?.hostel_id || !selectedStudent?.room_id) return null;
      const [hostelRes, roomRes, wardenRes] = await Promise.all([
        supabase.from('hostels').select('*').eq('id', selectedStudent.hostel_id).single(),
        supabase.from('rooms').select('*').eq('id', selectedStudent.room_id).single(),
        supabase.from('wardens').select('id').eq('hostel_id', selectedStudent.hostel_id).maybeSingle()
      ]);
      
      const wardenId = wardenRes.data?.id || hostelRes.data?.warden_id;
      
      return { 
        hostel: { ...hostelRes.data, computed_warden_id: wardenId }, 
        room: roomRes.data 
      };
    },
    enabled: !!selectedStudent?.hostel_id
  });

  // 4. Fetch Emergencies
  const { data: alerts } = useMyAlerts(selectedStudentId || '');
  const createAlert = useCreateAlert();
  const activeAlert = alerts?.find(a => a.status !== 'resolved');

  const [isConfirmingSos, setIsConfirmingSos] = useState(false);

  const handleTriggerSOS = async () => {
    if (!profile || !selectedStudentId) return;
    
    await createAlert.mutateAsync({
      type: 'security',
      location: 'Parent requested emergency check',
      college_id: profile.college_id,
      student_id: selectedStudentId
    });
    
    setIsConfirmingSos(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
            <ShieldCheck className="mr-3 text-primary-600 dark:text-primary-400" />
            Parent Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your child's progress and campus life</p>
        </div>

        {/* Student Selector */}
        {students && students.length > 1 && (
          <select
            value={selectedStudentId || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {isLoadingStudents ? (
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
          </div>
        </div>
      ) : students?.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
          <User className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Linked Students</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            You don't have any students linked to your account yet. Have your child generate an invite code from their profile to link their account.
          </p>
        </div>
      ) : (
        <>
          {/* Student Identity Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-2xl font-bold mr-6">
              {selectedStudent?.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStudent?.full_name}</h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1 space-x-4">
                <span>{selectedStudent?.gender}</span>
                <span>•</span>
                <span>{selectedStudent?.phone || 'No phone'}</span>
              </div>
            </div>
          </div>

          {/* Emergency SOS Banner */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
            <div className="flex items-start">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  Emergency Support
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  If you cannot reach your child, you can alert the campus warden immediately.
                </p>
                {activeAlert && (
                  <div className="mt-3 inline-flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/50">
                    <span className={`w-2 h-2 rounded-full mr-2 ${activeAlert.status === 'acknowledged' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></span>
                    SOS Active: {activeAlert.status === 'acknowledged' ? 'Warden is investigating' : 'Waiting for warden acknowledgment'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              {accommodation?.hostel?.computed_warden_id && (
                <button
                  onClick={() => navigate(`/chat?newUserId=${accommodation.hostel.computed_warden_id}`)}
                  className="px-5 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-sm"
                >
                  <MessageSquare size={18} className="mr-2" /> Chat with Warden
                </button>
              )}
              
              {!activeAlert && (
                isConfirmingSos ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleTriggerSOS}
                      disabled={createAlert.isPending}
                      className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] flex items-center justify-center min-w-[140px]"
                    >
                      {createAlert.isPending ? 'Sending...' : 'Confirm SOS'}
                    </button>
                    <button
                      onClick={() => setIsConfirmingSos(false)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirmingSos(true)}
                    className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center min-w-[140px]"
                  >
                    Raise SOS Alert
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academics Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center">
                <BookOpen className="mr-3 text-primary-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Progress</h3>
              </div>
              <div className="p-6 flex-1">
                {isLoadingAcademics ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                  </div>
                ) : enrollments?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">Not enrolled in any courses.</p>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Current Courses</h4>
                    {enrollments?.map(e => (
                      <div key={e.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <span className="font-medium text-gray-900 dark:text-white">{e.course?.name}</span>
                        <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 font-bold border border-gray-100 dark:border-gray-600">
                          {e.course?.credits} Cr
                        </span>
                      </div>
                    ))}
                    
                    {recentGrades && recentGrades.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                         <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                           <Award size={16} className="mr-2 text-primary-500" /> Recent Grades
                         </h4>
                         {recentGrades.map(g => (
                           <div key={g.id} className="flex justify-between items-center mb-2">
                             <span className="text-gray-600 dark:text-gray-400 text-sm">{g.assessment_name}</span>
                             <span className="font-black text-gray-900 dark:text-white">{g.grade}</span>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hostel Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center">
                <Building className="mr-3 text-primary-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hostel & Accommodation</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                {!selectedStudent?.hostel_id ? (
                  <div className="text-center py-8">
                    <Building className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Not allocated to any hostel.</p>
                  </div>
                ) : !accommodation ? (
                  <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full"></div>
                ) : (
                  <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-6 text-center">
                    <h4 className="text-2xl font-black text-primary-900 dark:text-primary-100 mb-1">
                      {accommodation.hostel?.name}
                    </h4>
                    <p className="text-primary-600 dark:text-primary-400 font-medium flex items-center justify-center mb-6">
                      <MapPin size={16} className="mr-1" /> On Campus
                    </p>
                    
                    <div className="inline-block bg-white dark:bg-gray-900 px-6 py-3 rounded-xl shadow-sm border border-primary-100 dark:border-primary-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Room Number</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{accommodation.room?.room_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
