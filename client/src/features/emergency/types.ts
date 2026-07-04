import type { Profile } from '../auth/types';

export type EmergencyType = 'medical' | 'security' | 'fire' | 'other';
export type EmergencyStatus = 'active' | 'acknowledged' | 'resolved';

export interface EmergencyAlert {
  id: string;
  college_id: string;
  student_id: string;
  type: EmergencyType;
  location: string | null;
  status: EmergencyStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  student?: Profile;
  resolver?: Profile;
}

export type CreateEmergencyDTO = Pick<EmergencyAlert, 'type' | 'location' | 'college_id' | 'student_id'>;
