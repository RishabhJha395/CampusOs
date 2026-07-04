import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { OnboardingWizard } from '../pages/onboarding/OnboardingWizard';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { Directory } from '../pages/admin/Directory';
import { HostelsAdmin } from '../pages/admin/Hostels';
import { StudentHostel } from '../pages/student/Hostel';
import { Marketplace } from '../pages/student/Marketplace';
import { StudentEmergency } from '../pages/student/Emergency';
import { EmergenciesAdmin } from '../pages/warden/Emergencies';
import { FacultyAcademics } from '../pages/faculty/Academics';
import { StudentAcademics } from '../pages/student/Academics';
import { ParentDashboard } from '../pages/parent/Dashboard';
import { Messages } from '../pages/shared/Messages';
import { Dashboard } from '../pages/shared/Dashboard';
import { Notifications } from '../pages/shared/Notifications';
import { WardenHostelManagement } from '../pages/warden/HostelManagement';
import { Clubs } from '../pages/student/Clubs';
import { Landing } from '../pages/public/Landing';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { 
    path: '/onboarding', 
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ) 
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: 'chat', element: <Messages /> },
      { path: 'profile', element: <Dashboard /> },
      { path: 'notifications', element: <Notifications /> },
      
      { path: 'student/dashboard', element: <Dashboard /> },
      { path: 'student/hostel', element: <StudentHostel /> },
      { path: 'student/emergency', element: <StudentEmergency /> },
      { path: 'student/academics', element: <StudentAcademics /> },
      { path: 'marketplace', element: <Marketplace /> },
      { path: 'clubs', element: <Clubs /> },
      
      { path: 'parent/dashboard', element: <ParentDashboard /> },
      
      { path: 'faculty/dashboard', element: <Dashboard /> },
      { path: 'faculty/academics', element: <FacultyAcademics /> },
      
      { path: 'warden/dashboard', element: <Dashboard /> },
      { path: 'warden/hostel', element: <WardenHostelManagement /> },
      { path: 'warden/emergencies', element: <EmergenciesAdmin /> },
      
      { path: 'admin/dashboard', element: <Dashboard /> },
      { path: 'college_admin/dashboard', element: <Dashboard /> },
      { path: 'admin/directory', element: <Directory /> },
      { path: 'admin/hostels', element: <HostelsAdmin /> },
      
      { path: 'superadmin/dashboard', element: <Dashboard /> },
    ],
  },
]);

export function AppRouter() {
  useAuthSession(); // Mount the auth listener globally
  return <RouterProvider router={router} />;
}
