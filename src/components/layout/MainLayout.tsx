import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  Home,
  Shield,
  Users,
  Calendar,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AuthService } from '../../services/api';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    first_name: string;
    last_name: string;
  } | null>(null);

  useEffect(() => {
    AuthService.me()
      .then((res) => setCurrentUser(res.data))
      .catch(() => {});
  }, []);

  const displayName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username
    : '';
  const avatarSeed = currentUser?.username || 'user';

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => setProfileOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  // Primary nav links shown in top bar
  const topNavLinks = [
    { label: 'Feed', to: '/feed' },
    { label: 'Hub', to: '/ssb' },
    { label: 'Groups', to: '/groups' },
    { label: 'Events', to: '/events' },
  ];

  // Full nav for mobile drawer
  const allNavLinks = [
    { icon: <Home size={18} />, label: 'Feed', to: '/feed' },
    { icon: <Shield size={18} />, label: 'SSB Hub', to: '/ssb' },
    { icon: <MessageSquare size={18} />, label: 'Messaging', to: '/chat' },
    { icon: <Users size={18} />, label: 'Connections', to: '/connections' },
    { icon: <Users size={18} />, label: 'Groups', to: '/groups' },
    { icon: <Calendar size={18} />, label: 'Events', to: '/events' },
    { icon: <Settings size={18} />, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Navbar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-md border-b border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <NavLink
            to="/feed"
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-primary" />
            </div>
            <span className="font-bold text-lg text-secondary-fixed tracking-tight hidden sm:block">
              SSB Connect
            </span>
          </NavLink>

          {/* Center nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {topNavLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-1.5 text-sm font-semibold rounded-md transition-all relative',
                    isActive
                      ? 'text-secondary-fixed after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-secondary-fixed after:rounded-full'
                      : 'text-on-primary-container hover:text-on-primary'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Upgrade pill */}
            <button className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-secondary-fixed hover:bg-secondary-container text-on-secondary-fixed text-xs font-bold rounded-full transition-all">
              <Zap size={12} />
              Upgrade
            </button>

            {/* Bell */}
            <button className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary-fixed rounded-full border border-primary" />
            </button>

            {/* Message */}
            <button
              onClick={() => navigate('/chat')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MessageSquare size={18} />
            </button>

            {/* Profile avatar dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 p-1 pl-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full border-2 border-secondary-fixed/50 overflow-hidden bg-primary-container">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="hidden lg:block text-sm font-semibold text-white/80 max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={14} className="hidden lg:block text-white/40" />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-xl border border-outline-variant/30 py-1 z-50">
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={15} className="text-slate-400" />
                    View Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={15} className="text-on-surface-variant" />
                    Settings
                  </NavLink>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="pt-14 min-h-screen">{children}</main>

      {/* ── Mobile Bottom Nav ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-primary border-t border-white/10 flex items-center justify-around px-2 z-50 pb-safe">
        {[
          { icon: <Home size={22} />, label: 'Feed', to: '/feed' },
          { icon: <Shield size={22} />, label: 'Hub', to: '/ssb' },
          { icon: <MessageSquare size={22} />, label: 'Chat', to: '/chat' },
          { icon: <Users size={22} />, label: 'Groups', to: '/groups' },
          { icon: <User size={22} />, label: 'Profile', to: '/profile' },
        ].map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all',
                isActive ? 'text-secondary-fixed' : 'text-white/40 hover:text-white/70'
              )
            }
          >
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 bg-primary h-full flex flex-col border-r border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center">
                  <Shield size={16} className="text-primary" />
                </div>
                <span className="font-bold text-secondary-fixed text-base">SSB Connect</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* User chip */}
            {currentUser && (
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-secondary-fixed/40 overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                  <p className="text-xs text-white/40">@{currentUser.username}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {allNavLinks.map(({ icon, label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all',
                      isActive
                        ? 'bg-secondary-fixed/15 text-secondary-fixed font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  {icon}
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
