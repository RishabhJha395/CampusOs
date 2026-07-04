export type UserRole = 'super_admin' | 'college_admin' | 'faculty' | 'student' | 'parent' | 'warden';

export interface Profile {
  id: string;
  college_id: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  bio?: string;
  is_active: boolean;
  onboarding_completed: boolean;
  last_seen_at?: string;
}

export interface AuthState {
  session: any | null; // Supabase Session type
  profile: Profile | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}
