import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useActiveAlerts, useAcknowledgeAlert, useResolveAlert } from '../../features/emergency/hooks/useEmergency';
import { AlertTriangle, MapPin, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

export function EmergenciesAdmin() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const collegeId = profile?.college_id || '';
  
  const { data: alerts, isLoading } = useActiveAlerts(collegeId);
  const acknowledgeAlert = useAcknowledgeAlert(collegeId);
  const resolveAlert = useResolveAlert(collegeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
            <ShieldAlert className="mr-3 text-red-600 dark:text-red-500" />
            Security Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and respond to campus emergencies</p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
          ))}
        </div>
      ) : alerts?.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Clear</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are no active emergency alerts right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts?.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-red-500 dark:border-red-500/50 shadow-lg shadow-red-500/10 overflow-hidden relative">
              {alert.status === 'active' && (
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 animate-pulse"></div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${alert.status === 'active' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'}`}>
                      <AlertTriangle size={24} className={alert.status === 'active' ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{alert.type} SOS</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Clock size={14} className="mr-1" />
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Student</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.student?.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{alert.student?.phone || 'No phone provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <MapPin size={14} className="mr-1 text-primary-500" />
                      {alert.location || 'Location not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => acknowledgeAlert.mutate(alert.id)}
                      disabled={acknowledgeAlert.isPending}
                      className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => resolveAlert.mutate({ alertId: alert.id, resolverId: profile!.id })}
                    disabled={resolveAlert.isPending}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
