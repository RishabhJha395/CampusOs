import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { getNavConfig } from './navConfig';
import { LogOut, Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CommandPalette } from '../CommandPalette';
import { authService } from '../../features/auth/services/authService';
import { useUnreadCounts, useActiveEmergencies } from '../../features/notifications/hooks/useNotifications';

export function AppShell() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: unreadCounts } = useUnreadCounts();
  const { data: emergencies } = useActiveEmergencies(profile?.role);
  
  const totalUnreadChats = unreadCounts?.reduce((sum, item) => sum + item.unread_count, 0) || 0;
  const totalEmergencies = emergencies?.length || 0;
  
  if (!profile) return null;

  const navItems = getNavConfig(profile.role);

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="font-bold text-xl text-primary-600 dark:text-primary-400">CampusOS</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:block">
            <div className="font-bold text-2xl tracking-tight text-primary-600 dark:text-primary-400">CampusOS</div>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl transition-colors border border-gray-200 dark:border-gray-700 shadow-sm group"
            >
              <div className="flex items-center">
                <Search size={18} className="mr-2 group-hover:text-primary-500 transition-colors" />
                <span className="text-sm font-medium">Search...</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] px-1.5 py-0.5 font-sans">⌘</kbd>
                <kbd className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] px-1.5 py-0.5 font-sans">K</kbd>
              </div>
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              
              let badgeCount = 0;
              if (item.href === '/chat') badgeCount = totalUnreadChats;
              if (item.href === '/notifications') badgeCount = totalUnreadChats + totalEmergencies;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-xl transition-colors relative ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="relative">
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
                {profile.full_name.charAt(0)}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
