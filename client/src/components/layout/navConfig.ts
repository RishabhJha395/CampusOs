import type { UserRole } from '../../features/auth/types';
import { 
  Home, Users, Calendar, Building, MessageSquare, 
  Bell, AlertTriangle, ShoppingBag, User
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const getNavConfig = (role: UserRole): NavItem[] => {
  const baseNav: NavItem[] = [
    { label: 'Dashboard', href: `/${role}/dashboard`, icon: Home },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'My Profile', href: '/profile', icon: User },
  ];

  switch (role) {
    case 'student':
      return [
        ...baseNav,
        { label: 'Hostel', href: '/student/hostel', icon: Building },
        { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
        { label: 'Clubs & Events', href: '/clubs', icon: Calendar },
        { label: 'Emergency', href: '/student/emergency', icon: AlertTriangle },
      ];
    case 'faculty':
      return [
        ...baseNav,
        // Removed Departments and Mentorship temporarily as requested
        // { label: 'Departments', href: '/faculty/departments', icon: Briefcase },
        // { label: 'Mentorship', href: '/faculty/mentor', icon: Users },
      ];
    case 'warden':
      return [
        ...baseNav,
        { label: 'Hostel Management', href: '/warden/hostel', icon: Building },
        { label: 'Emergencies', href: '/warden/emergencies', icon: AlertTriangle },
      ];
    case 'college_admin':
      return [
        ...baseNav,
        { label: 'Directory', href: '/admin/directory', icon: Users },
        { label: 'Hostels', href: '/admin/hostels', icon: Building },
      ];
    default:
      return baseNav;
  }
};
