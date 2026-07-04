import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/departmentService';
import type { CreateDepartmentDTO, UpdateDepartmentDTO } from '../types';

const KEYS = {
  all: (collegeId: string) => ['departments', collegeId] as const,
};

export function useDepartments(collegeId: string) {
  return useQuery({
    queryKey: KEYS.all(collegeId),
    queryFn: () => departmentService.getDepartments(collegeId),
    enabled: !!collegeId,
  });
}

export function useCreateDepartment(collegeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDepartmentDTO) => departmentService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(collegeId) });
    },
  });
}

export function useUpdateDepartment(collegeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentDTO }) => 
      departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(collegeId) });
    },
  });
}

export function useDeleteDepartment(collegeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(collegeId) });
    },
  });
}
