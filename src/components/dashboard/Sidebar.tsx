'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Map as MapIcon,
  TrendingUp,
  Cpu,
  Route,
  Home,
  AlertTriangle,
  MessageSquare,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '@/components/SessionProvider';
import { useRouter } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Environmental Sensors', href: '/dashboard/sensors', icon: Activity },
  { name: 'Live Flood Map', href: '/dashboard/map', icon: MapIcon },
  { name: 'Flood Prediction', href: '/dashboard/prediction', icon: TrendingUp },
  { name: 'AI Agents', href: '/dashboard/agents', icon: Cpu },
  { name: 'Evacuation Routes', href: '/dashboard/routes', icon: Route },
  { name: 'Shelter Management', href: '/dashboard/shelters', icon: Home },
  { name: 'Emergency Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
  { name: 'AI Assistant', href: '/dashboard/assistant', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'User Management', href: '/dashboard/users', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_mode');
    }
    try {
      const { auth } = await import('@/lib/firebase/config');
      await auth.signOut();
    } catch (e) {
      console.warn('Firebase signOut skipped or failed', e);
    }
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 dark:bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30">
              FR
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FloodRakshak</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] justify-between py-4">
          <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-cyan-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
