import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MapPin, Shield, Trophy, MessageSquare, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { icon: <Home size={24} />, label: 'Feed', to: '/feed' },
    { icon: <MapPin size={24} />, label: 'Nearby', to: '/map' },
    { icon: <Shield size={24} />, label: 'SSB', to: '/ssb' },
    { icon: <Trophy size={24} />, label: 'Fitness', to: '/fitness' },
    { icon: <MessageSquare size={24} />, label: 'Chat', to: '/chat' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-navy-50 pb-20">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-navy-900 text-white flex items-center justify-between px-4 z-50 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-500 rounded flex items-center justify-center font-bold text-white">SC</div>
          <span className="font-display font-bold tracking-tight">SSB CONNECT</span>
        </div>
        <NavLink to="/profile" className="w-8 h-8 rounded-full border-2 border-accent-400 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya" alt="Profile" />
        </NavLink>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-navy-100 flex items-center justify-around px-2 z-50 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-full h-full transition-all",
              isActive ? "text-accent-600" : "text-navy-500"
            )}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MobileLayout;
