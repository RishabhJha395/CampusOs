import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '../services/emergencyService';
import type { CreateEmergencyDTO } from '../types';

const KEYS = {
  activeAlerts: (collegeId: string) => ['emergency_alerts', 'active', collegeId] as const,
  myAlerts: (studentId: string) => ['emergency_alerts', 'student', studentId] as const,
};

// For Wardens/Admins
export function useActiveAlerts(collegeId: string) {
  return useQuery({
    queryKey: KEYS.activeAlerts(collegeId),
    queryFn: () => emergencyService.getActiveAlerts(collegeId),
    enabled: !!collegeId,
    refetchInterval: 5000, // Poll every 5 seconds for emergencies
  });
}

// For Students
export function useMyAlerts(studentId: string) {
  return useQuery({
    queryKey: KEYS.myAlerts(studentId),
    queryFn: () => emergencyService.getMyAlerts(studentId),
    enabled: !!studentId,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmergencyDTO) => emergencyService.createAlert(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.myAlerts(variables.student_id) });
      queryClient.invalidateQueries({ queryKey: KEYS.activeAlerts(variables.college_id) });
    },
  });
}

export function useResolveAlert(collegeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, resolverId }: { alertId: string; resolverId: string }) => 
      emergencyService.resolveAlert(alertId, resolverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.activeAlerts(collegeId) });
    },
  });
}

export function useAcknowledgeAlert(collegeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => emergencyService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.activeAlerts(collegeId) });
    },
  });
}
