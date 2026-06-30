import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  MapPin,
  Shield,
  Trophy,
  MessageSquare,
  User,
  Settings,
  Users,
  UserPlus,
  Calendar,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  Bot,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AuthService } from '../../services/api';
import { BrandLogo } from '../brand/BrandLogo';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    AuthService.me()
      .then((res) => setCurrentUser(res.data))
      .catch(() => {});
  }, []);

  const displayName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username
    : 'Loading...';
  const avatarSeed = currentUser?.username || 'user';

  const navItems = [
    { icon: <Home size={20} />, label: 'Feed', to: '/feed' },
    { icon: <MapPin size={20} />, label: 'Discover', to: '/map' },
    { icon: <UserPlus size={20} />, label: 'Connections', to: '/connections' },
    { icon: <Shield size={20} />, label: 'SSB Practice', to: '/ssb' },
    { icon: <Bot size={20} />, label: 'AI Mentor', to: '/ai-mentor' },
    { icon: <Trophy size={20} />, label: 'Fitness', to: '/fitness' },
    { icon: <Users size={20} />, label: 'Groups', to: '/groups' },
    { icon: <Calendar size={20} />, label: 'Events', to: '/events' },
    { icon: <MessageSquare size={20} />, label: 'Messages', to: '/chat' },
  ];

  const bottomNavItems = [
    { icon: <Home size={24} />, label: 'Feed', to: '/feed' },
    { icon: <Shield size={24} />, label: 'SSB', to: '/ssb' },
    { icon: <Bot size={24} />, label: 'AI', to: '/ai-mentor' },
    { icon: <MessageSquare size={24} />, label: 'Chat', to: '/chat' },
    { icon: <User size={24} />, label: 'Profile', to: '/profile' },
  ];

  const navLinkClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
      isActive
        ? 'bg-accent-500 text-white font-bold shadow-md shadow-accent-500/25'
        : 'text-white/60 hover:bg-midnight-800 hover:text-white'
    );

  return (
    <div className="min-h-screen bg-navy-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-midnight-900 text-white fixed h-full z-50 border-r border-midnight-700">
        <div className="p-5 border-b border-midnight-700">
          <BrandLogo className="text-white" to="/feed" />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-midnight-700 space-y-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm',
                isActive ? 'bg-army-800 text-white font-bold' : 'text-white/60 hover:text-white hover:bg-midnight-800'
              )
            }
          >
            <Settings size={20} /> Settings
          </NavLink>
          <button
            type="button"
            onClick={() => AuthService.logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-midnight-800 rounded-xl transition-colors text-sm"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-navy-100 sticky top-0 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-navy-600 hover:bg-navy-50 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="text"
                placeholder="Search aspirants, boards, or groups..."
                className="w-full bg-navy-50 border border-navy-100 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-accent-400 focus:border-accent-300 transition-all"
              />
            </div>
            <div className="lg:hidden">
              <BrandLogo className="text-navy-900" imageClassName="h-8 w-8" to="/feed" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-navy-500 hover:bg-navy-50 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gold-500 rounded-full border-2 border-white" />
            </button>
            <NavLink
              to="/profile"
              className="flex items-center gap-2 p-1 pr-2 sm:pr-3 hover:bg-navy-50 rounded-full transition-colors min-w-0 max-w-[52vw] sm:max-w-none"
            >
              <div className="w-8 h-8 rounded-full border-2 border-accent-400 overflow-hidden flex-shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt="Profile" />
              </div>
              <span className="text-sm font-bold text-navy-900 truncate">{displayName}</span>
            </NavLink>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-navy-100 flex items-center justify-around px-2 z-50 pb-safe">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full transition-all',
                  isActive ? 'text-accent-600' : 'text-navy-500'
                )
              }
            >
              {item.icon}
              <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-midnight-900/60 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="w-72 bg-midnight-900 h-full flex flex-col border-r border-midnight-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex items-center justify-between border-b border-midnight-700">
              <BrandLogo className="text-white" to="/feed" />
              <button onClick={() => setIsSidebarOpen(false)} className="text-white/50 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-midnight-700 space-y-2 shrink-0 pb-safe">
              <NavLink
                to="/settings"
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                    isActive ? 'bg-army-800 text-white font-bold' : 'text-white/60 hover:text-white hover:bg-midnight-800'
                  )
                }
              >
                <Settings size={20} /> Settings
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  AuthService.logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-midnight-800 transition-colors text-sm rounded-xl"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
