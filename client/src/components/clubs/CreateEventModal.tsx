import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft, Type } from 'lucide-react';
import { useCreateEvent } from '../../features/clubs/hooks/useClubs';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
}

export function CreateEventModal({ isOpen, onClose, clubId, clubName }: CreateEventModalProps) {
  const [error, setError] = useState('');
  const createEvent = useCreateEvent();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EventFormData>();

  if (!isOpen) return null;

  const onSubmit = async (data: EventFormData) => {
    try {
      setError('');
      await createEvent.mutateAsync({
        club_id: clubId,
        ...data,
      });
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Event</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Hosting for {clubName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Type size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="block w-full pl-10 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                placeholder="e.g. Annual Tech Symposium"
              />
            </div>
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <AlignLeft size={18} className="text-gray-400" />
              </div>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="block w-full pl-10 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900 dark:text-white resize-none"
                placeholder="What is this event about?"
              />
            </div>
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  {...register('event_date', { required: 'Date is required' })}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full pl-10 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                />
              </div>
              {errors.event_date && <p className="mt-1 text-sm text-red-500">{errors.event_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={18} className="text-gray-400" />
                </div>
                <input
                  type="time"
                  {...register('event_time', { required: 'Time is required' })}
                  className="block w-full pl-10 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                />
              </div>
              {errors.event_time && <p className="mt-1 text-sm text-red-500">{errors.event_time.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                {...register('location', { required: 'Location is required' })}
                className="block w-full pl-10 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                placeholder="e.g. Auditorium A"
              />
            </div>
            {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
