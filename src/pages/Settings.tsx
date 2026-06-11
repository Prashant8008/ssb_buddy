import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  User,
  Bell,
  Eye,
  Palette,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { AuthService, ProfileService } from '../services/api';

const Settings = () => {
  const menuItems = [
    { icon: <User size={18} />, label: 'Account', path: '' },
    { icon: <Eye size={18} />, label: 'Privacy', path: 'privacy' },
    { icon: <Bell size={18} />, label: 'Notifications', path: 'notifications' },
    { icon: <Palette size={18} />, label: 'Theme', path: 'theme' },
    { icon: <ShieldCheck size={18} />, label: 'Security', path: 'security' },
  ];

  return (
    <div className="max-w-6xl mx-auto pt-20 pb-10 px-4">
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end
              className={({ isActive }) => cn(
                'flex items-center justify-between p-3 rounded-xl transition-all font-medium text-sm',
                isActive
                  ? 'bg-navy-900 text-white shadow-lg'
                  : 'text-navy-600 hover:bg-navy-100'
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              <ChevronRight size={16} className="opacity-50" />
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => AuthService.logout()}
            className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm mt-8"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="lg:col-span-3">
          <Routes>
            <Route path="/" element={<AccountSettings />} />
            <Route path="/privacy" element={<PrivacySettings />} />
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="/theme" element={<ThemeSettings />} />
            <Route path="/security" element={<SecuritySettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const AccountSettings = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    AuthService.me()
      .then((res) => {
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
        setUsername(res.data.username || '');
        setEmail(res.data.email || '');
      })
      .finally(() => setLoading(false));
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
      setMessage('Account updated successfully.');
    } catch (e: any) {
      setMessage(e.response?.data?.detail || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 flex justify-center">
        <Loader2 className="animate-spin text-navy-400" size={28} />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-navy-900 mb-6">Account Information</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-500 uppercase">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-navy-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-500 uppercase">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-navy-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-navy-500 uppercase">Username</label>
          <input
            type="text"
            value={username}
            readOnly
            className="w-full bg-navy-100 border-none rounded-lg p-3 text-sm text-navy-500 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-navy-500 uppercase">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-navy-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
          />
        </div>
        {message && (
          <p className={cn('text-sm', message.includes('success') ? 'text-green-600' : 'text-red-500')}>
            {message}
          </p>
        )}
        <div className="pt-6 border-t border-navy-50">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-navy-900 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-navy-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </Card>
  );
};

const PrivacySettings = () => {
  const [publicProfile, setPublicProfile] = useState(true);
  const [friendsOnly, setFriendsOnly] = useState(false);
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

  const setVisibility = async (mode: 'public' | 'followers' | 'private') => {
    const updates = {
      public: { public_profile: true, friends_only: false },
      followers: { public_profile: true, friends_only: true },
      private: { public_profile: false, friends_only: false },
    }[mode];
    setSaving(true);
    setMessage('');
    try {
      await ProfileService.updateMe(updates);
      setPublicProfile(updates.public_profile);
      setFriendsOnly(updates.friends_only);
      setMessage('Privacy settings saved.');
    } catch {
      setMessage('Failed to save privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  const currentMode = !publicProfile ? 'private' : friendsOnly ? 'followers' : 'public';

  if (loading) {
    return (
      <Card className="p-12 flex justify-center">
        <Loader2 className="animate-spin text-navy-400" size={28} />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-navy-900 mb-6">Privacy Controls</h3>
      <div className="space-y-6">
        <PrivacyToggle
          label="Profile Visibility"
          desc="Who can see your profile and SSB journey"
          options={['Public', 'Followers', 'Private']}
          active={currentMode === 'public' ? 'Public' : currentMode === 'followers' ? 'Followers' : 'Private'}
          onSelect={(opt) => {
            const map: Record<string, 'public' | 'followers' | 'private'> = {
              Public: 'public',
              Followers: 'followers',
              Private: 'private',
            };
            setVisibility(map[opt]);
          }}
          disabled={saving}
        />
        {message && <p className="text-sm text-green-600">{message}</p>}
      </div>
    </Card>
  );
};

const PrivacyToggle = ({
  label,
  desc,
  options,
  active,
  onSelect,
  disabled,
}: {
  label: string;
  desc: string;
  options: string[];
  active: string;
  onSelect: (opt: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-navy-50 rounded-xl">
    <div>
      <p className="font-bold text-navy-900 text-sm">{label}</p>
      <p className="text-xs text-navy-500">{desc}</p>
    </div>
    <div className="flex bg-white p-1 rounded-lg border border-navy-100">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className={cn(
            'px-3 py-1 text-[10px] font-bold rounded transition-colors',
            active === opt ? 'bg-navy-900 text-white' : 'hover:bg-navy-50'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

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
      <Card className="p-12 flex justify-center">
        <Loader2 className="animate-spin text-navy-400" size={28} />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-navy-900 mb-6">Notifications</h3>
      <div className="space-y-4">
        <ToggleItem
          label="Email Notifications"
          checked={emailNotif}
          onChange={(v) => toggle('email_notifications', v)}
        />
        <ToggleItem
          label="Push Notifications"
          checked={pushNotif}
          onChange={(v) => toggle('push_notifications', v)}
        />
      </div>
    </Card>
  );
};

const ThemeSettings = () => (
  <Card className="p-6">
    <h3 className="text-lg font-bold text-navy-900 mb-6">Appearance</h3>
    <p className="text-sm text-navy-500">Theme switching coming soon. Light mode is active.</p>
    <div className="grid grid-cols-3 gap-4 mt-4">
      <ThemeCard label="Light" active />
      <ThemeCard label="Dark" />
      <ThemeCard label="System" />
    </div>
  </Card>
);

const SecuritySettings = () => (
  <Card className="p-6">
    <h3 className="text-lg font-bold text-navy-900 mb-6">Security</h3>
    <div className="p-4 bg-navy-50 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center text-gold-600">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="font-bold text-sm">Two-Factor Authentication</p>
          <p className="text-xs text-navy-500">Coming in a future update</p>
        </div>
      </div>
    </div>
  </Card>
);

const ToggleItem = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-navy-800">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'w-10 h-5 rounded-full relative transition-colors',
        checked ? 'bg-gold-500' : 'bg-navy-200'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-3 h-3 bg-white rounded-full transition-all',
          checked ? 'left-6' : 'left-1'
        )}
      />
    </button>
  </div>
);

const ThemeCard = ({ label, active = false }: { label: string; active?: boolean }) => (
  <div
    className={cn(
      'aspect-video rounded-xl border-2 flex items-center justify-center cursor-default transition-all',
      active ? 'border-gold-500 bg-navy-50' : 'border-navy-100 opacity-50'
    )}
  >
    <span className="text-xs font-bold">{label}</span>
  </div>
);

export default Settings;
