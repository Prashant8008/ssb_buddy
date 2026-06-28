import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MapPin, 
  Shield, 
  Trophy, 
  MessageSquare, 
  Bell, 
  Search,
  Settings as SettingsIcon
} from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-navy-900 text-white z-50 border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-white text-xl">
            SC
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden md:block">
            SSB CONNECT
          </span>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input 
              type="text" 
              placeholder="Search aspirants, boards, or groups..."
              className="w-full bg-navy-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-accent-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          <NavIcon icon={<Home size={20} />} label="Feed" to="/feed" />
          <NavIcon icon={<MapPin size={20} />} label="Nearby" to="/map" />
          <NavIcon icon={<Shield size={20} />} label="SSB" to="/ssb" />
          <NavIcon icon={<Trophy size={20} />} label="Fitness" to="/fitness" />
          <NavIcon icon={<MessageSquare size={20} />} label="Chat" to="/chat" />
          <div className="w-px h-8 bg-navy-800 mx-2 hidden md:block" />
          <NavIcon icon={<SettingsIcon size={20} />} label="Settings" to="/settings" />
          <NavLink to="/profile" className="w-8 h-8 rounded-full bg-accent-500 border-2 border-accent-300 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya" alt="Profile" />
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

const NavIcon = ({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => `
      flex flex-col items-center justify-center p-2 rounded-lg transition-all
      ${isActive ? 'text-accent-300 bg-navy-800' : 'text-navy-300 hover:text-white hover:bg-navy-800'}
    `}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium hidden md:block">{label}</span>
  </NavLink>
);

export default Navbar;
