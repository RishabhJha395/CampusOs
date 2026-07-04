export type HostelType = 'boys' | 'girls' | 'co-ed';

export interface Hostel {
  id: string;
  college_id: string;
  name: string;
  type: HostelType;
  total_capacity: number | null;
  warden_id: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  college_id: string;
  hostel_id: string;
  room_number: string;
  capacity: number;
  occupied_count: number;
  created_at: string;
  updated_at: string;
}

export type CreateHostelDTO = Pick<Hostel, 'name' | 'type' | 'college_id' | 'total_capacity' | 'address'>;
export type CreateRoomDTO = Pick<Room, 'room_number' | 'capacity' | 'college_id' | 'hostel_id'>;
