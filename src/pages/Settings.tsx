import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Lock,
  Palette,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Loader2,
  Edit,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  CheckCircle,
  Eye
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { AuthService, ProfileService } from '../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const menuItems = [
    { icon: <User size={18} />, label: 'Account', path: '' },
    { icon: <Lock size={18} />, label: 'Privacy', path: 'privacy' },
    { icon: <Bell size={18} />, label: 'Notifications', path: 'notifications' },
    { icon: <Palette size={18} />, label: 'Theme', path: 'theme' },
    { icon: <ShieldCheck size={18} />, label: 'Security', path: 'security' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-[#191c1f] font-sans">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-4 flex flex-col gap-1.5">
            <h2 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest px-3 mb-2">Settings</h2>
            
            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) => cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  isActive
                    ? 'bg-[#000317] text-white shadow-sm'
                    : 'text-[#45464e] hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                <ChevronRight size={14} className="opacity-55" />
              </NavLink>
            ))}

            <hr className="my-3 border-[#c6c6cf]/20" />
            <button
              onClick={() => {
                AuthService.logout();
                navigate('/login');
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 max-w-2xl">
          <Routes>
            <Route path="/" element={<AccountSettings />} />
            <Route path="/privacy" element={<PrivacySettings />} />
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="/theme" element={<ThemeSettings />} />
            <Route path="/security" element={<SecuritySettings />} />
          </Routes>
        </section>
      </div>
    </div>
  );
};

// ── Account Subpage ───────────────────────────────────────────────────────────
const AccountSettings = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getAvatar = (seed: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const meRes = await AuthService.me();
        setFirstName(meRes.data.first_name || '');
        setLastName(meRes.data.last_name || '');
        setUsername(meRes.data.username || '');
        setEmail(meRes.data.email || '');

        const profileRes = await ProfileService.getMe();
        setBio(profileRes.data.bio || '');
      } catch (err) {
        console.error('Failed to load settings user info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await AuthService.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });
      await ProfileService.updateMe({ bio: bio.trim() });
      setMessage('Account updated successfully.');
    } catch (e: any) {
      setMessage(e.response?.data?.detail || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 flex justify-center border-[#c6c6cf]/20">
        <Loader2 className="animate-spin text-[#ffe08f]" size={28} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#000317] tracking-tight">Account Settings</h1>
      
      {/* Profile info block */}
      <div className="bg-white rounded-2xl border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-[#ffe08f] bg-slate-50 flex-shrink-0">
              <img className="w-full h-full object-cover" src={getAvatar(username)} alt="" />
            </div>
            <button className="absolute bottom-0 right-0 bg-[#000317] text-white p-1.5 rounded-full shadow-md hover:scale-105 transition-transform">
              <Edit size={12} />
            </button>
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1A1F36]">{firstName} {lastName}</h3>
            <p className="text-xs text-[#6B7280]">@{username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#000317] outline-none text-[#191c1f]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#000317] outline-none text-[#191c1f]"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#000317] outline-none text-[#191c1f]"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#000317] outline-none resize-none text-[#191c1f]"
            />
          </div>
        </div>

        {message && (
          <p className={cn('text-xs font-semibold mt-4', message.includes('success') ? 'text-green-600' : 'text-red-500')}>
            {message}
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#000317] hover:bg-[#0f1c3f] text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="animate-spin" size={12} /> : null}
            Save Changes
          </button>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200/50 rounded-2xl p-6">
        <h3 className="font-bold text-sm text-red-700 uppercase tracking-wide">Danger Zone</h3>
        <p className="text-xs text-red-900 mt-2 leading-relaxed">
          Deleting your account is permanent. All your progress, OLQ tracker logs, and discussions will be deleted forever.
        </p>
        <button className="mt-4 border border-red-500 hover:bg-red-500 hover:text-white text-red-500 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all">
          Delete Account
        </button>
      </div>
    </div>
  );
};

// ── Privacy Subpage ──────────────────────────────────────────────────────────
const PrivacySettings = () => {
  const [publicProfile, setPublicProfile] = useState(true);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    ProfileService.getMe()
      .then((res) => {
        setPublicProfile(res.data.public_profile ?? true);
        setFriendsOnly(res.data.friends_only ?? false);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSwitch = async (mode: 'public' | 'private' | 'stats', checked: boolean) => {
    setSaving(true);
    setMessage('');
    try {
      if (mode === 'public') {
        const updates = { public_profile: checked, friends_only: false };
        await ProfileService.updateMe(updates);
        setPublicProfile(checked);
        setFriendsOnly(false);
      } else if (mode === 'private') {
        const updates = { public_profile: !checked, friends_only: checked };
        await ProfileService.updateMe(updates);
        setPublicProfile(!checked);
        setFriendsOnly(checked);
      } else if (mode === 'stats') {
        setShowStats(checked);
      }
      setMessage('Privacy settings saved.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 flex justify-center border-[#c6c6cf]/20">
        <Loader2 className="animate-spin text-[#ffe08f]" size={28} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#000317] tracking-tight">Privacy Controls</h1>
      
      <div className="bg-white rounded-2xl border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-6 space-y-6">
        
        {/* Toggle 1: Public Profile */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#000317]">Public Profile Visibility</h4>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Make your profile visible to selectors and other aspirants.</p>
          </div>
          <button
            onClick={() => toggleSwitch('public', !publicProfile)}
            disabled={saving}
            className={cn(
              "w-11 h-6 rounded-full p-1 transition-colors relative duration-200",
              publicProfile ? "bg-[#ffe08f]" : "bg-slate-200"
            )}
          >
            <div className={cn(
              "bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200",
              publicProfile ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        {/* Toggle 2: Show Practice Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#000317]">Show Practice Radar Stats</h4>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Allow others to see your OLQ progress charts and mock results.</p>
          </div>
          <button
            onClick={() => toggleSwitch('stats', !showStats)}
            disabled={saving}
            className={cn(
              "w-11 h-6 rounded-full p-1 transition-colors relative duration-200",
              showStats ? "bg-[#ffe08f]" : "bg-slate-200"
            )}
          >
            <div className={cn(
              "bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200",
              showStats ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        {message && <p className="text-xs font-semibold text-green-600 mt-2">{message}</p>}
      </div>
    </div>
  );
};

// ── Notifications Subpage ────────────────────────────────────────────────────
const NotificationSettings = () => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProfileService.getMe()
      .then((res) => {
        setEmailNotif(res.data.email_notifications ?? true);
        setPushNotif(res.data.push_notifications ?? true);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (field: 'email_notifications' | 'push_notifications', value: boolean) => {
    if (field === 'email_notifications') setEmailNotif(value);
    else setPushNotif(value);
    try {
      await ProfileService.updateMe({ [field]: value });
    } catch {
      if (field === 'email_notifications') setEmailNotif(!value);
      else setPushNotif(!value);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 flex justify-center border-[#c6c6cf]/20">
        <Loader2 className="animate-spin text-[#ffe08f]" size={28} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#000317] tracking-tight">Notification Alerts</h1>
      
      <div className="bg-white rounded-2xl border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-6 space-y-6">
        
        {/* Email Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#000317]">Email Digest Notifications</h4>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Weekly digest summarizing academy updates and local group drills.</p>
          </div>
          <button
            onClick={() => toggle('email_notifications', !emailNotif)}
            className={cn(
              "w-11 h-6 rounded-full p-1 transition-colors relative duration-200",
              emailNotif ? "bg-[#ffe08f]" : "bg-slate-200"
            )}
          >
            <div className={cn(
              "bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200",
              emailNotif ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        {/* Push Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#000317]">Flash Drill Alerts</h4>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Instant alerts when timed psychology mock sessions begin.</p>
          </div>
          <button
            onClick={() => toggle('push_notifications', !pushNotif)}
            className={cn(
              "w-11 h-6 rounded-full p-1 transition-colors relative duration-200",
              pushNotif ? "bg-[#ffe08f]" : "bg-slate-200"
            )}
          >
            <div className={cn(
              "bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200",
              pushNotif ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

      </div>
    </div>
  );
};

// ── Theme Subpage ────────────────────────────────────────────────────────────
const ThemeSettings = () => (
  <div className="space-y-6">
    <h1 className="text-xl font-bold text-[#000317] tracking-tight">Theme Preferences</h1>
    
    <div className="bg-white rounded-2xl border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <button className="p-4 border-2 border-[#ffe08f] bg-slate-50 rounded-xl flex flex-col items-center gap-3 transition-all select-none">
          <Sun className="text-[#000317] w-8 h-8" />
          <span className="text-xs font-bold text-[#000317]">Light Active</span>
        </button>
        
        <button className="p-4 border border-[#c6c6cf]/30 bg-slate-50/50 opacity-60 rounded-xl flex flex-col items-center gap-3 transition-all cursor-not-allowed">
          <Moon className="text-[#76767f] w-8 h-8" />
          <span className="text-xs font-bold text-[#76767f]">Dark Mode</span>
        </button>

      </div>
    </div>
  </div>
);

// ── Security Subpage ──────────────────────────────────────────────────────────
const SecuritySettings = () => (
  <div className="space-y-6">
    <h1 className="text-xl font-bold text-[#000317] tracking-tight">Security Access</h1>
    
    <div className="bg-white rounded-2xl border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] p-6 space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[#000317]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#000317]">Two-Factor Authentication</h4>
            <p className="text-[11px] text-[#6B7280]">Add a hardware or software authenticator layer to logins.</p>
          </div>
        </div>
        <button className="bg-slate-100 text-[#000317] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full border border-slate-200">
          Enable
        </button>
      </div>

      <hr className="border-[#c6c6cf]/10" />

      <div>
        <h4 className="font-bold text-xs text-[#000317] mb-3">Active Registered Devices</h4>
        
        <div className="flex items-center justify-between py-3 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <Laptop className="text-[#76767f]" size={18} />
            <div>
              <p className="text-xs font-bold text-[#000317]">Windows PC • New Delhi, IN</p>
              <p className="text-[10px] text-[#6B7280]">Current active session</p>
            </div>
          </div>
          <span className="text-[9px] text-[#785d00] bg-[#ffe08f]/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Smartphone className="text-[#76767f]" size={18} />
            <div>
              <p className="text-xs font-bold text-[#000317]">iPhone 15 • Bangalore, IN</p>
              <p className="text-[10px] text-[#6B7280]">Last active: 2 hours ago</p>
            </div>
          </div>
          <button className="text-xs font-bold text-red-600 hover:underline">Revoke</button>
        </div>
      </div>

    </div>
  </div>
);

export default Settings;
