import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { useWardenHostel, useHostelStudents } from '../../features/hostels/hooks/useHostels';
import { Building, Users, Search, MessageSquare, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export function WardenHostelManagement() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  // Fetch the warden's assigned hostel
  const { data: hostel, isLoading: isLoadingHostel } = useWardenHostel(profile?.id || null);
  
  // Fetch students in this hostel
  const { data: students, isLoading: isLoadingStudents } = useHostelStudents(hostel?.id || null);
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students?.filter(student => 
    student.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rooms?.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingHostel || isLoadingStudents) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
        <Shield className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Not Assigned to a Hostel</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
          You have not been assigned as a warden to any hostel yet. Please contact the college administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mr-6 shadow-sm">
            <Building size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {hostel.name}
            </h1>
            <div className="flex items-center text-gray-500 dark:text-gray-400 mt-2 space-x-4">
              <span className="capitalize">{hostel.type} Hostel</span>
              <span>•</span>
              <span className="flex items-center"><Users size={16} className="mr-1" /> {students?.length || 0} Residents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resident Students</h2>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Student</th>
                <th className="p-4">Room</th>
                <th className="p-4">Parent Status</th>
                <th className="p-4 text-right pr-6">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStudents?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents?.map((student) => {
                  const activeParentLinks = student.parent_student_links?.filter((link: any) => link.status === 'active') || [];
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold flex items-center justify-center mr-3 shrink-0">
                            {student.profiles?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{student.profiles?.full_name}</div>
                            <div className="text-xs text-gray-500">{student.profiles?.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-bold text-sm">
                          {student.rooms?.room_number || 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-4">
                        {activeParentLinks.length > 0 ? (
                          <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle size={16} className="mr-1.5" /> Linked ({activeParentLinks.length})
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                            <AlertCircle size={16} className="mr-1.5" /> Unlinked
                          </div>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        {/* Chat with Student */}
                        <button
                          onClick={() => navigate(`/chat?newUserId=${student.profiles.id}`)}
                          className="inline-flex items-center px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg text-sm font-bold transition-colors"
                          title="Message Student"
                        >
                          <MessageSquare size={16} className="mr-1" /> Student
                        </button>

                        {/* Chat with Parent(s) */}
                        {activeParentLinks.map((link: any, idx: number) => {
                          const parentProfile = link.parents?.profiles;
                          if (!parentProfile) return null;
                          return (
                            <button
                              key={parentProfile.id}
                              onClick={() => navigate(`/chat?newUserId=${parentProfile.id}`)}
                              className="inline-flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-sm font-bold transition-colors"
                              title={`Message ${parentProfile.full_name}`}
                            >
                              <MessageSquare size={16} className="mr-1" /> Parent {idx > 0 ? idx + 1 : ''}
                            </button>
                          );
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
