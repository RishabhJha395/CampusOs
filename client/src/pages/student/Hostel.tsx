import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useRoommates } from '../../features/hostels/hooks/useHostels';
import { DoorOpen, Building, Users, MapPin, User, MessageCircle } from 'lucide-react';

export function StudentHostel() {
  const { profile } = useSelector((state: RootState) => state.auth);
  
  // 1. Fetch the student's room and hostel info
  const { data: accommodation, isLoading } = useQuery({
    queryKey: ['student-accommodation', profile?.id],
    queryFn: async () => {
      // First get student record
      const { data: student } = await supabase
        .from('students')
        .select('hostel_id, room_id')
        .eq('id', profile?.id)
        .single();
        
      if (!student?.hostel_id || !student?.room_id) return null;

      // Then get hostel and room details
      const [hostelRes, roomRes] = await Promise.all([
        supabase.from('hostels').select('*').eq('id', student.hostel_id).single(),
        supabase.from('rooms').select('*').eq('id', student.room_id).single()
      ]);

      return {
        hostel: hostelRes.data,
        room: roomRes.data
      };
    },
    enabled: !!profile?.id
  });

  // 2. Fetch roommates
  const { data: roommates, isLoading: isLoadingRoommates } = useRoommates(
    accommodation?.room?.id || null, 
    profile?.id || ''
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed h-96">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <DoorOpen size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Room Assigned</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          You haven't been assigned to a hostel room yet. Please contact your warden or college admin for room allocation.
        </p>
      </div>
    );
  }

  const { hostel, room } = accommodation;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Accommodation</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View your hostel details and roommates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hostel Info Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-sm font-medium mb-6">
              <Building size={16} className="mr-2" />
              {hostel?.type} Hostel
            </div>
            
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">{hostel?.name}</h2>
            <div className="flex items-center text-primary-100 mb-8">
              <MapPin size={18} className="mr-2" />
              {hostel?.address || 'On Campus'}
            </div>

            <div className="flex items-center space-x-12">
              <div>
                <p className="text-primary-200 text-sm font-medium mb-1">Room Number</p>
                <div className="flex items-center">
                  <DoorOpen size={24} className="mr-3 text-white" />
                  <span className="text-3xl font-bold">{room?.room_number}</span>
                </div>
              </div>
              <div>
                <p className="text-primary-200 text-sm font-medium mb-1">Capacity</p>
                <div className="flex items-center">
                  <Users size={24} className="mr-3 text-white" />
                  <span className="text-3xl font-bold">{room?.occupied_count} / {room?.capacity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roommates Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Users size={20} className="mr-2 text-primary-500" />
              My Roommates
            </h3>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-lg">
              {roommates?.length || 0}
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {isLoadingRoommates ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : roommates?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <User size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">You are currently the only occupant in this room.</p>
              </div>
            ) : (
              roommates?.map((mate) => (
                <div key={mate.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold mr-3">
                      {mate.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{mate.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{mate.bio || 'Student'}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                    <MessageCircle size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
