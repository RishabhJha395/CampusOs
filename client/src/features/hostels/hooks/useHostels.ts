import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelService } from '../services/hostelService';
import type { CreateHostelDTO, CreateRoomDTO } from '../types';

const KEYS = {
  hostels: (collegeId: string) => ['hostels', collegeId] as const,
  rooms: (hostelId: string) => ['rooms', hostelId] as const,
  roommates: (roomId: string) => ['roommates', roomId] as const,
};

export function useHostels(collegeId: string) {
  return useQuery({
    queryKey: KEYS.hostels(collegeId),
    queryFn: () => hostelService.getHostels(collegeId),
    enabled: !!collegeId,
  });
}

export function useCreateHostel(collegeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHostelDTO) => hostelService.createHostel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.hostels(collegeId) });
    },
  });
}

export function useRooms(hostelId: string | null) {
  return useQuery({
    queryKey: KEYS.rooms(hostelId!),
    queryFn: () => hostelService.getRooms(hostelId!),
    enabled: !!hostelId,
  });
}

export function useCreateRoom(hostelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomDTO) => hostelService.createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.rooms(hostelId) });
    },
  });
}

export function useRoommates(roomId: string | null, currentUserId: string) {
  return useQuery({
    queryKey: KEYS.roommates(roomId!),
    queryFn: () => hostelService.getRoommates(roomId!, currentUserId),
    enabled: !!roomId && !!currentUserId,
  });
}

export function useWardenHostel(wardenId: string | null) {
  return useQuery({
    queryKey: ['warden-hostel', wardenId],
    queryFn: () => hostelService.getWardenHostel(wardenId!),
    enabled: !!wardenId,
  });
}

export function useHostelStudents(hostelId: string | null) {
  return useQuery({
    queryKey: ['hostel-students', hostelId],
    queryFn: () => hostelService.getHostelStudents(hostelId!),
    enabled: !!hostelId,
  });
}
