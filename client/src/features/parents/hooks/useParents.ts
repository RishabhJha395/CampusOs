import { useQuery } from '@tanstack/react-query';
import { parentService } from '../services/parentService';

const KEYS = {
  linkedStudents: (parentId: string) => ['linked_students', parentId] as const,
};

export function useLinkedStudents(parentId: string) {
  return useQuery({
    queryKey: KEYS.linkedStudents(parentId),
    queryFn: () => parentService.getLinkedStudents(parentId),
    enabled: !!parentId,
  });
}
