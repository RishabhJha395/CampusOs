import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useMyAlerts, useCreateAlert } from '../../features/emergency/hooks/useEmergency';
import type { EmergencyType } from '../../features/emergency/types';
import { AlertTriangle, MapPin, CheckCircle, Clock } from 'lucide-react';

export function StudentEmergency() {
  const { profile } = useSelector((state: RootState) => state.auth);
  
  const { data: alerts, isLoading } = useMyAlerts(profile?.id || '');
  const createAlert = useCreateAlert();

  const [type, setType] = useState<EmergencyType>('other');
  const [location, setLocation] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const activeAlert = alerts?.find(a => a.status !== 'resolved');

  const handleTriggerSOS = async () => {
    if (!profile) return;
    
    await createAlert.mutateAsync({
      type,
      location,
      college_id: profile.college_id,
      student_id: profile.id
    });
    
    setIsConfirming(false);
    setLocation('');
    setType('other');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
          <AlertTriangle className="mr-3 text-red-600 dark:text-red-500" />
          Emergency SOS
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Instantly alert campus security and wardens in case of an emergency.
        </p>
      </div>

      {activeAlert ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500/50 rounded-3xl p-8 text-center shadow-lg shadow-red-500/10">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={48} className="text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">SOS Broadcast Active</h2>
          <p className="text-red-700 dark:text-red-300 mb-6 max-w-md mx-auto">
            Campus security and wardens have been notified. Please stay calm and remain in a safe location until help arrives.
          </p>
          
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30">
            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
              <Clock size={16} className="text-gray-400 mr-2" />
              Triggered: {new Date(activeAlert.created_at).toLocaleTimeString()}
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${activeAlert.status === 'acknowledged' ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`}></span>
              Status: {activeAlert.status === 'acknowledged' ? 'Help is on the way' : 'Waiting for acknowledgment'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <div className="text-center max-w-lg mx-auto">
            {isConfirming ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-200">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Emergency Details</h3>
                
                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Emergency Type</label>
                    <select
                      value={type} onChange={(e) => setType(e.target.value as EmergencyType)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="medical">Medical Emergency</option>
                      <option value="security">Security Threat</option>
                      <option value="fire">Fire / Hazard</option>
                      <option value="other">Other / General Help</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                      <MapPin size={16} className="mr-1.5" /> Exact Location (Optional)
                    </label>
                    <input
                      type="text" placeholder="e.g. Room A-101, Near Main Gate..."
                      value={location} onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleTriggerSOS}
                    disabled={createAlert.isPending}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 text-lg"
                  >
                    {createAlert.isPending ? 'Broadcasting...' : 'BROADCAST SOS'}
                  </button>
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirming(true)}
                className="group relative w-64 h-64 mx-auto rounded-full bg-red-600 text-white shadow-2xl shadow-red-600/40 hover:bg-red-700 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center active:scale-95"
              >
                <div className="absolute inset-0 rounded-full border-4 border-red-400 opacity-50 scale-110 group-hover:animate-ping"></div>
                <AlertTriangle size={64} className="mb-4" />
                <span className="text-4xl font-black tracking-widest">SOS</span>
                <span className="text-sm font-medium text-red-200 mt-2">TAP FOR HELP</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {!isLoading && alerts && alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Past Alerts</h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {alerts.filter(a => a.status === 'resolved').map(alert => (
                <li key={alert.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center">
                    <CheckCircle size={20} className="text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{alert.type} Emergency</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Resolved
                  </span>
                </li>
              ))}
              {alerts.filter(a => a.status === 'resolved').length === 0 && (
                 <li className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No past alerts.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
