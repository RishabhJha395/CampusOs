import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useClubs, useUpcomingEvents, useJoinClub, useLeaveClub } from '../../features/clubs/hooks/useClubs';
import { CreateEventModal } from '../../components/clubs/CreateEventModal';
import { Calendar, Users, MapPin, Clock, Plus, Check, Search, CalendarPlus, X } from 'lucide-react';

export function Clubs() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'clubs' | 'events'>('clubs');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClubForEvent, setSelectedClubForEvent] = useState<{id: string, name: string} | null>(null);

  const { data: clubs, isLoading: loadingClubs } = useClubs();
  const { data: events, isLoading: loadingEvents } = useUpcomingEvents();
  
  const joinClub = useJoinClub();
  const leaveClub = useLeaveClub();

  const handleJoinLeave = (clubId: string, isMember: boolean) => {
    if (!profile) return;
    if (isMember) {
      leaveClub.mutate({ clubId, studentId: profile.id });
    } else {
      joinClub.mutate({ clubId, studentId: profile.id });
    }
  };

  const openEventModal = (clubId: string, clubName: string) => {
    setSelectedClubForEvent({ id: clubId, name: clubName });
    setIsModalOpen(true);
  };

  const filteredClubs = clubs?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <Users size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Clubs & Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Discover communities and campus happenings.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex space-x-1 w-full sm:w-auto p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <button
            onClick={() => setActiveTab('clubs')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'clubs'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Discover Clubs
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'events'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Upcoming Events
          </button>
        </div>

        {activeTab === 'clubs' && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-sm"
            />
          </div>
        )}
      </div>

      {/* Clubs Grid */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingClubs ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 h-64 rounded-3xl animate-pulse"></div>
            ))
          ) : filteredClubs?.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No clubs found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search.</p>
            </div>
          ) : (
            filteredClubs?.map(club => {
              const isMember = club.members?.some(m => m.student_id === profile?.id);
              const isPresident = club.president_id === profile?.id;

              return (
                <div key={club.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {club.category}
                    </span>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      <Users size={16} className="mr-1.5" />
                      {club.members?.length || 0}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{club.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1 line-clamp-3">
                    {club.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">President: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{club.president?.full_name || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {isPresident ? (
                      <button
                        onClick={() => openEventModal(club.id, club.name)}
                        className="w-full py-2.5 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-indigo-500/20"
                      >
                        <CalendarPlus size={18} className="mr-2" />
                        Host Event
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinLeave(club.id, !!isMember)}
                        disabled={joinClub.isPending || leaveClub.isPending}
                        className={`w-full py-2.5 flex items-center justify-center text-sm font-medium rounded-xl transition-all ${
                          isMember 
                            ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400' 
                            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20'
                        }`}
                      >
                        {isMember ? (
                          <>
                            <Check size={18} className="mr-2 group-hover:hidden" />
                            <X size={18} className="mr-2 hidden group-hover:block" />
                            <span className="group-hover:hidden">Joined</span>
                            <span className="hidden group-hover:block">Leave Club</span>
                          </>
                        ) : (
                          <>
                            <Plus size={18} className="mr-2" />
                            Join Club
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Events List */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {loadingEvents ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 h-32 rounded-2xl animate-pulse"></div>
            ))
          ) : events?.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No upcoming events</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Check back later for new campus activities!</p>
            </div>
          ) : (
            events?.map(event => {
              const eventDate = new Date(event.event_date);
              
              // Convert 24h to 12h time
              const [hours, minutes] = event.event_time.split(':');
              const timeObj = new Date();
              timeObj.setHours(parseInt(hours, 10));
              timeObj.setMinutes(parseInt(minutes, 10));
              const formattedTime = timeObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

              return (
                <div key={event.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl p-4 w-24 h-24">
                    <span className="text-xs font-bold uppercase tracking-widest">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-3xl font-black">{eventDate.getDate()}</span>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md">
                        {event.club?.name}
                      </span>
                      <span className="text-xs text-gray-400">• {event.club?.category}</span>
                      <span className="text-xs text-gray-400">• {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{event.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1.5 text-gray-400" />
                        {formattedTime}
                      </div>
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-1.5 text-gray-400" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clubId={selectedClubForEvent?.id || ''}
        clubName={selectedClubForEvent?.name || ''}
      />
    </div>
  );
}
