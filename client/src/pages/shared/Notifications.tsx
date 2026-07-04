import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { useUnreadCounts, useActiveEmergencies } from '../../features/notifications/hooks/useNotifications';
import { useMyChannels } from '../../features/chat/hooks/useChat';
import { Bell, MessageSquare, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

export function Notifications() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const { data: unreadCounts, isLoading: isLoadingUnread } = useUnreadCounts();
  const { data: emergencies, isLoading: isLoadingEmergencies } = useActiveEmergencies(profile?.role);
  const { data: channels } = useMyChannels(profile?.id || '');

  const isLoading = isLoadingUnread || (profile?.role === 'warden' && isLoadingEmergencies);

  // Map unread counts to channel objects
  const unreadChats = (unreadCounts || [])
    .filter(u => u.unread_count > 0)
    .map(u => {
      const channel = channels?.find(c => c.id === u.channel_id);
      return {
        ...u,
        channel,
      };
    })
    .filter(u => u.channel); // Ensure channel was found

  const hasNotifications = (unreadChats.length > 0) || (emergencies && emergencies.length > 0);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
        ))}
      </div>
    );
  }

  const getOtherParticipant = (channel: any) => {
    return channel.participants?.find((p: any) => p.user_id !== profile?.id)?.profile;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-sm">
          <Bell size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">Stay updated on your messages and alerts.</p>
        </div>
      </div>

      {!hasNotifications ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
          <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're all caught up!</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are no new notifications or unread messages at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Emergency Alerts (Wardens) */}
          {emergencies && emergencies.length > 0 && (
            <div className="mb-8 space-y-4">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-red-500" /> Action Required
              </h2>
              {emergencies.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => navigate('/warden/emergencies')}
                  className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-2xl p-5 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-start sm:items-center justify-between group shadow-sm"
                >
                  <div className="flex items-start sm:items-center flex-col sm:flex-row">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shrink-0 mb-3 sm:mb-0 sm:mr-4">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">Active SOS Alert</h3>
                      <p className="text-red-700 dark:text-red-300">
                        <span className="font-semibold">{alert.student?.profile?.full_name || 'A student'}</span> triggered an emergency SOS.
                      </p>
                      <span className="text-xs text-red-500 dark:text-red-400 mt-1 block">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-red-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ArrowRight size={24} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unread Chats */}
          {unreadChats.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">
                Unread Messages
              </h2>
              {unreadChats.map((u) => {
                const otherPerson = u.channel?.type === 'direct' ? getOtherParticipant(u.channel) : null;
                const displayName = u.channel?.type === 'direct' ? otherPerson?.full_name : u.channel?.name;
                
                return (
                  <div 
                    key={u.channel_id}
                    onClick={() => navigate('/chat')}
                    className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-lg mr-4 shrink-0">
                          {displayName?.charAt(0) || 'C'}
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-gray-900">
                          {u.unread_count > 99 ? '99+' : u.unread_count}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {displayName}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center">
                          <MessageSquare size={14} className="mr-1.5 text-primary-500" />
                          You have {u.unread_count} unread {u.unread_count === 1 ? 'message' : 'messages'}.
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
