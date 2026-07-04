import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useHostels, useCreateHostel, useRooms, useCreateRoom } from '../../features/hostels/hooks/useHostels';
import { Building, Plus, DoorOpen, Users } from 'lucide-react';
import type { HostelType } from '../../features/hostels/types';

export function HostelsAdmin() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const collegeId = profile?.college_id || '';
  
  const { data: hostels, isLoading } = useHostels(collegeId);
  const createHostel = useCreateHostel(collegeId);

  const [isCreating, setIsCreating] = useState(false);
  const [newHostelName, setNewHostelName] = useState('');
  const [newHostelType, setNewHostelType] = useState<HostelType>('co-ed');
  const [newHostelCapacity, setNewHostelCapacity] = useState('');

  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);
  
  // Rooms for the selected hostel
  const { data: rooms, isLoading: isLoadingRooms } = useRooms(selectedHostelId);
  const createRoom = useCreateRoom(selectedHostelId || '');
  
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('2');

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostelName) return;
    
    await createHostel.mutateAsync({
      name: newHostelName,
      type: newHostelType,
      capacity: newHostelCapacity ? parseInt(newHostelCapacity) : null,
      college_id: collegeId,
      address: null
    } as any);
    
    setNewHostelName('');
    setNewHostelCapacity('');
    setIsCreating(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !selectedHostelId) return;
    
    await createRoom.mutateAsync({
      room_number: newRoomNumber,
      capacity: parseInt(newRoomCapacity),
      hostel_id: selectedHostelId,
      college_id: collegeId,
    });
    
    setNewRoomNumber('');
    setNewRoomCapacity('2');
    setIsCreatingRoom(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hostel Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure campus housing and rooms</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm active:scale-[0.98]"
        >
          <Plus size={20} className="mr-2" />
          Add Hostel
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">New Hostel Structure</h2>
          <form onSubmit={handleCreateHostel} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text" placeholder="Hostel Name (e.g. Aryabhatta Bhawan)" required
                value={newHostelName} onChange={(e) => setNewHostelName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="w-full md:w-32">
              <select
                value={newHostelType} onChange={(e) => setNewHostelType(e.target.value as HostelType)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="co-ed">Co-ed</option>
              </select>
            </div>
            <div className="w-full md:w-40">
              <input
                type="number" placeholder="Capacity" min="1"
                value={newHostelCapacity} onChange={(e) => setNewHostelCapacity(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createHostel.isPending} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity font-medium">
                {createHostel.isPending ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hostels List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Campus Hostels</h2>
          
          {isLoading ? (
            <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
          ) : hostels?.length === 0 ? (
             <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
              <Building className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No hostels added.</p>
            </div>
          ) : (
            hostels?.map((hostel) => (
              <div 
                key={hostel.id} 
                onClick={() => setSelectedHostelId(hostel.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedHostelId === hostel.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm ring-1 ring-primary-500' 
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{hostel.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-0.5">{hostel.type} Hostel</p>
                  </div>
                  <Building size={20} className={selectedHostelId === hostel.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Room Management (Visible when a hostel is selected) */}
        <div className="lg:col-span-2">
          {selectedHostelId ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rooms Configuration</h2>
                <button
                  onClick={() => setIsCreatingRoom(!isCreatingRoom)}
                  className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} className="mr-1.5" /> Add Room
                </button>
              </div>

              {isCreatingRoom && (
                <form onSubmit={handleCreateRoom} className="flex gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <input
                    type="text" placeholder="Room No. (e.g. A-101)" required
                    value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  />
                  <input
                    type="number" placeholder="Capacity" min="1" max="10" required
                    value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(e.target.value)}
                    className="w-24 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700">
                    Add
                  </button>
                </form>
              )}

              {isLoadingRooms ? (
                <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800 rounded-xl w-full"></div>
              ) : rooms?.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <DoorOpen className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                  No rooms configured for this hostel yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {rooms?.map((room) => (
                    <div key={room.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/30">
                      <DoorOpen size={24} className="text-primary-500 mb-2" />
                      <span className="font-bold text-gray-900 dark:text-white">{room.room_number}</span>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Users size={12} className="mr-1" />
                        {room.occupied_count} / {room.capacity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
              <div>
                <Building className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-800 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a hostel</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a hostel from the list to manage its rooms.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
