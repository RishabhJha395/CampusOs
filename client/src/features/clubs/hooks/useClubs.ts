import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubService } from '../services/clubService';

export const CLUB_KEYS = {
  all: ['clubs'] as const,
  events: ['club_events'] as const,
};

export function useClubs() {
  return useQuery({
    queryKey: CLUB_KEYS.all,
    queryFn: () => clubService.getClubs(),
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: CLUB_KEYS.events,
    queryFn: () => clubService.getUpcomingEvents(),
  });
}

export function useJoinClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, studentId }: { clubId: string, studentId: string }) => 
      clubService.joinClub(clubId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUB_KEYS.all });
    }
  });
}

export function useLeaveClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, studentId }: { clubId: string, studentId: string }) => 
      clubService.leaveClub(clubId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUB_KEYS.all });
    }
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clubService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUB_KEYS.events });
    }
  });
}
