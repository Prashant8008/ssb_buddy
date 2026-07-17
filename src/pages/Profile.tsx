import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, GraduationCap, Shield, Award, Edit3,
  Share2, CheckCircle2, Trophy, Grid, Heart,
  Loader2, Save, X, MessageCircle, FileText, ExternalLink, ChevronDown,
  BookOpen, Info, CheckCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { ProfileService, AuthService, FeedService } from '../services/api';
import ConnectActions, { ConnectionStatus } from '../components/social/ConnectActions';
import { formatDistanceToNow } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────
interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_email_verified: boolean;
}

interface ProfileData {
  id: number;
  user: UserData;
  profile_picture: string;
  cover_photo: string;
  bio: string;
  age: number | null;
  gender: string;
  country: string;
  state: string;
  city: string;
  school: string;
  college: string;
  degree: string;
  graduation_year: number | null;
  entry_type: string;
  preferred_service: string;
  ssb_attempts: number;
  recommended_status: boolean;
  ssb_board: string;
  reporting_date: string | null;
}

interface Post {
  id: string;
  author_username: string;
  body: string;
  title: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  image_url: string;
  video_url?: string;
  document_url?: string;
}

const getAvatar = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

const ENTRY_TYPES = ['NDA', 'CDS', 'AFCAT', 'INET', 'AGNIVEER'];
const SERVICES = ['ARMY', 'NAVY', 'AIR_FORCE'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({
  profile, onClose, onSaved
}: {
  profile: ProfileData;
  onClose: () => void;
  onSaved: (p: ProfileData) => void;
}) => {
  const [form, setForm] = useState({
    bio: profile.bio || '',
    city: profile.city || '',
    state: profile.state || '',
    country: profile.country || '',
    age: profile.age || '',
    gender: profile.gender || '',
    college: profile.college || '',
    degree: profile.degree || '',
    graduation_year: profile.graduation_year || '',
    school: profile.school || '',
    entry_type: profile.entry_type || '',
    preferred_service: profile.preferred_service || '',
    ssb_attempts: profile.ssb_attempts || 0,
    ssb_board: profile.ssb_board || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, any> = { ...form };
      const numericFields = ['age', 'graduation_year', 'ssb_attempts'];
      for (const field of numericFields) {
        if (payload[field] === '' || payload[field] === null || payload[field] === undefined) {
          payload[field] = null;
        } else {
          payload[field] = Number(payload[field]);
        }
      }
      const res = await ProfileService.updateMe(payload);
      onSaved(res.data);
      onClose();
    } catch (e: any) {
      const data = e.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        const messages = Object.entries(data)
          .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join('; ');
        setError(messages || 'Failed to save. Please try again.');
      } else {
        setError(data?.detail || 'Failed to save. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000317]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-bold text-[#000317] text-lg">Edit Profile Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Candidate Bio</label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell the community about your SSB story..."
              rows={3}
              className="w-full bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Location</label>
            <div className="grid grid-cols-3 gap-3">
              {['city', 'state', 'country'].map(field => (
                <input
                  key={field}
                  value={(form as any)[field]}
                  onChange={e => set(field, e.target.value)}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
                />
              ))}
            </div>
          </div>

          {/* Personal */}
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Personal Info</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="Age"
                className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              />
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
                className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              >
                <option value="">Select Gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* SSB Info */}
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">SSB Target & Wing</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.entry_type}
                onChange={e => set('entry_type', e.target.value)}
                className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              >
                <option value="">Entry Type</option>
                {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={form.preferred_service}
                onChange={e => set('preferred_service', e.target.value)}
                className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              >
                <option value="">Preferred Service</option>
                {SERVICES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <input
                type="number"
                value={form.ssb_attempts}
                onChange={e => set('ssb_attempts', e.target.value)}
                placeholder="SSB Attempts"
                min={0}
                className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              />
              <input
                value={form.ssb_board}
                onChange={e => set('ssb_board', e.target.value)}
                placeholder="SSB Board (e.g. Bhopal 22 SSB)"
                className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Education Profile</label>
            <div className="space-y-3">
              <input
                value={form.school}
                onChange={e => set('school', e.target.value)}
                placeholder="School name"
                className="w-full bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.college}
                  onChange={e => set('college', e.target.value)}
                  placeholder="College / University"
                  className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
                />
                <input
                  value={form.degree}
                  onChange={e => set('degree', e.target.value)}
                  placeholder="Degree (e.g. B.Sc, B.Tech)"
                  className="bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
                />
              </div>
              <input
                type="number"
                value={form.graduation_year}
                onChange={e => set('graduation_year', e.target.value)}
                placeholder="Graduation Year"
                className="w-full bg-[#f2f3f7] border border-[#c6c6cf]/40 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#000317] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-[#6B7280] font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#000317] text-white font-bold text-sm hover:bg-[#0f1c3f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
const Profile = () => {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const [activeTab, setActiveTab] = useState('posts');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const meRes = await AuthService.me();
        const me = meRes.data as UserData;
        const viewingOther = routeUsername && routeUsername !== me.username;

        if (viewingOther && routeUsername) {
          const [profileRes, connRes] = await Promise.all([
            ProfileService.getByUsername(routeUsername),
            ProfileService.getConnectionStatus(routeUsername),
          ]);
          setProfile(profileRes.data);
          setUser(profileRes.data.user);
          setConnection(connRes.data);
          setIsOwnProfile(false);
        } else {
          const profileRes = await ProfileService.getMe();
          setUser(me);
          setProfile(profileRes.data);
          setConnection(null);
          setIsOwnProfile(true);
        }
      } catch (e) {
        console.error('Profile load failed:', e);
        setProfile(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [routeUsername]);

  const loadUserPosts = async (userId: number, page: number, replace: boolean) => {
    if (replace) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
      const res = await ProfileService.getUserPosts(userId, page);
      const data: Post[] = res.data.results || res.data;
      const count = res.data.count ?? data.length;
      if (replace) {
        setPosts(data);
        setPostsPage(1);
      } else {
        setPosts((prev) => [...prev, ...data]);
      }
      setPostsHasMore(page * 20 < count);
    } catch {
      if (replace) setPosts([]);
    } finally {
      setPostsLoading(false);
      setPostsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts' && user) {
      loadUserPosts(user.id, 1, true);
    }
  }, [activeTab, user?.id]);

  const loadMorePosts = () => {
    if (!user || postsLoadingMore || !postsHasMore) return;
    const next = postsPage + 1;
    setPostsPage(next);
    loadUserPosts(user.id, next, false);
  };

  const tabs = [
    { id: 'posts', label: 'Posts', icon: <Grid size={16} /> },
    { id: 'ssb', label: 'SSB Info', icon: <Shield size={16} /> },
    { id: 'education', label: 'Education', icon: <GraduationCap size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#ffe08f]" size={36} />
          <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500 font-bold text-sm">Failed to load candidate profile.</p>
      </div>
    );
  }

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
  const locationStr = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && isOwnProfile && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEdit(false)}
            onSaved={(p) => setProfile(p)}
          />
        )}
      </AnimatePresence>

      {/* Header Profile Section */}
      <header className="relative w-full rounded-2xl overflow-hidden border border-[#c6c6cf]/20 bg-white mb-8">
        {/* Cover Photo */}
        <div className="h-48 md:h-60 w-full relative overflow-hidden bg-[#000317]">
          {profile.cover_photo ? (
            <img src={profile.cover_photo} className="w-full h-full object-cover opacity-60" alt="Cover" />
          ) : (
            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-bottom" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBQ2TITOkKD0F6Q6UzXC9TOOucC3uQqjuIF8YT3FL6hqcZkspLDWMxjrJ140XIJu35UjZw0Npxm4HVGWhsXD6a9yiQsVh707t9ByAd0fYrmEWHZ49vedf6siMAmH8YuQCLLo2Yavg08-4OPf0uQvoQJEpEpu21FeSTbUrgnoScwr7IuzHdl1jIKf-QqbBjSda9DmdwAOopEQhuS0iERFdmpgBwyaZ57BvtmcGpwKsVnbLrSe5jsMMjocYoAU5Kkhso0YrY-1u6EWFDd')" }}></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000317]/80 to-transparent"></div>
        </div>

        {/* Identity & Stats Row */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 -mt-16 md:-mt-20">
            {/* Avatar block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-[3px] border-[#ffe08f] overflow-hidden shadow-xl bg-white flex-shrink-0">
                  <img
                    src={profile.profile_picture || getAvatar(user.username)}
                    className="w-full h-full object-cover"
                    alt="Avatar"
                  />
                </div>
                {profile.recommended_status && (
                  <div className="absolute -bottom-1 right-1 bg-[#ffe08f] text-[#241a00] p-1.5 rounded-full border-2 border-white shadow-md">
                    <Shield size={14} className="fill-current" />
                  </div>
                )}
              </div>
              <div className="pb-1">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white md:drop-shadow-md">{fullName}</h1>
                  {profile.recommended_status && (
                    <span className="bg-[#ffe08f]/20 text-[#ffe08f] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Recommended</span>
                  )}
                </div>
                <p className="text-xs text-[#7984ad] mt-0.5 md:drop-shadow">@{user.username}</p>
              </div>
            </div>

            {/* Connection Actions & Stats */}
            <div className="flex flex-col sm:flex-row items-center gap-4 self-center md:self-end">
              <div className="flex gap-6 py-3 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-center shadow-sm">
                <div>
                  <div className="text-sm font-extrabold text-[#000317]">{posts.length}</div>
                  <div className="text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold">Posts</div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#000317]">
                    {connection ? connection.followers_count : profile.ssb_attempts * 12 + 10}
                  </div>
                  <div className="text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold">Connections</div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#000317]">{profile.ssb_attempts}</div>
                  <div className="text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold">Attempts</div>
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#000317] hover:bg-[#0f1c3f] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              ) : (
                connection && (
                  <ConnectActions
                    userId={user.id}
                    username={user.username}
                    connection={connection}
                    onConnectionChange={setConnection}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Details Sidebar (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* About Bio Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border-l-4 border-[#000317]">
            <h3 className="text-sm font-bold text-[#000317] mb-3 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-[#ffe08f]" /> About Candidate
            </h3>
            <p className="text-xs text-[#45464e] leading-relaxed whitespace-pre-line">
              {profile.bio || "No candidate details added yet. Tap edit to update."}
            </p>
          </div>

          {/* SSB Target Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <h3 className="text-sm font-bold text-[#000317] mb-4 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-[#ffe08f]" /> SSB Profile
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#f2f3f7] rounded-lg">
                <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">Target Entry</span>
                <span className="text-xs font-bold text-[#000317]">{profile.entry_type || '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#f2f3f7] rounded-lg">
                <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">Preferred Service</span>
                <span className="text-xs font-bold text-[#000317]">{profile.preferred_service?.replace('_', ' ') || '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#f2f3f7] rounded-lg">
                <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">SSB Board</span>
                <span className="text-xs font-bold text-[#000317]">{profile.ssb_board || '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#f2f3f7] rounded-lg">
                <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">Attempts</span>
                <span className="text-xs font-bold text-[#000317]">{profile.ssb_attempts}</span>
              </div>
            </div>
          </div>

          {/* Education & Location */}
          <div className="bg-white rounded-2xl p-6 border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Education Info</h4>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#000317] border border-slate-100 flex-shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#000317]">{profile.degree || '—'}</p>
                    <p className="text-[10px] text-[#6B7280]">{profile.college || '—'}{profile.graduation_year ? ` · ${profile.graduation_year}` : ''}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Candidate Location</h4>
                <div className="flex gap-2 items-center text-xs text-[#000317] font-semibold mb-3">
                  <MapPin size={14} className="text-[#ffe08f]" /> {locationStr || 'India'}
                </div>
                <div className="rounded-xl overflow-hidden h-28 bg-[#edeef2] border border-[#c6c6cf]/40 relative bg-cover bg-center grayscale" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYNj-3mrkrWBEE-88771SOfJ-k5uCVqinP1hehZEadRuvqzIOYdDegZ-aWryt5jHIOseb_q51fMnSbikImYP5v7AyrDvhYtDm4dI9ABD8-NAJmgIiiNkRKeKPVbSq5oix_U-IlzeZlVy-F31Vg460vVv4bp4gz04HZzfe1r5UjSD__XZPxdge4wke5IELMiYa-PolsVNoOXpx4X64_O2OE-QTRT-H7RvRGN-ikz6etET8vtWCdjtImWqdfM91kiBZXPmNyM9gKBFr9')" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Tabs & Dynamic Lists (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#c6c6cf]/20 p-1 flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border-b-2',
                  activeTab === tab.id
                    ? 'border-[#ffe08f] text-[#000317] bg-slate-50'
                    : 'border-transparent text-[#76767f] hover:text-[#000317]'
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Tab content rendering */}
          <AnimatePresence mode="wait">
            
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {postsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-[#ffe08f]" size={28} />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white border border-[#c6c6cf]/20 p-12 rounded-2xl text-center shadow-sm">
                    <Grid className="text-slate-300 mx-auto mb-3" size={32} />
                    <p className="font-bold text-xs text-[#000317] uppercase tracking-wider">No Posts Yet</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {isOwnProfile
                        ? 'Write notes or share an experience on the feed!'
                        : `This candidate has not posted yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map(post => (
                      <div key={post.id} className="bg-white rounded-2xl overflow-hidden border border-[#c6c6cf]/20 shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-transform">
                        {post.image_url ? (
                          <div className="h-40 relative">
                            <img src={post.image_url} className="w-full h-full object-cover" alt="" />
                            <div className="absolute top-3 right-3 bg-[#000317]/80 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {post.post_type.replace('_', ' ')}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[#ffe08f] bg-[#000317] px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {post.post_type.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-[#6B7280]">
                              {(() => { try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); } catch { return ''; } })()}
                            </span>
                          </div>
                        )}
                        <div className="p-5 flex flex-col h-fit">
                          <h4 className="font-bold text-sm text-[#000317] mb-2 line-clamp-1">{post.title || 'Candidate Note'}</h4>
                          <p className="text-xs text-[#45464e] leading-relaxed line-clamp-3 mb-4">{post.body}</p>
                          
                          {post.document_url && (
                            <a
                              href={post.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#f2f3f7] border border-[#c6c6cf]/30 hover:border-[#ffe08f] transition-all text-[11px] font-semibold text-[#000317] mb-4"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="flex-1 truncate">View Attached Document</span>
                            </a>
                          )}

                          <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-[#6B7280]">
                            <span className="flex items-center gap-1 text-[10px] font-semibold">
                              <Heart size={14} /> {post.likes_count} Likes
                            </span>
                            <span className="text-[10px] text-[#6B7280] flex items-center gap-1 font-semibold">
                              <MessageCircle size={14} /> {post.comments_count} Comments
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {postsHasMore && (
                      <div className="md:col-span-2 flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={loadMorePosts}
                          disabled={postsLoadingMore}
                          className="flex items-center gap-2 text-xs font-bold text-[#000317] hover:text-[#ffe08f] uppercase tracking-wider py-2 px-6 rounded-full border border-[#c6c6cf] hover:border-[#000317] bg-white transition-all"
                        >
                          {postsLoadingMore ? <Loader2 className="animate-spin" size={14} /> : <ChevronDown size={14} />}
                          {postsLoadingMore ? 'Loading...' : 'Load More Posts'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* SSB Info Tab */}
            {activeTab === 'ssb' && (
              <motion.div
                key="ssb"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {[
                  { label: 'Target Entry Type', value: profile.entry_type || '—' },
                  { label: 'Preferred Service Wing', value: profile.preferred_service?.replace('_', ' ') || '—' },
                  { label: 'SSB Attempts Count', value: profile.ssb_attempts?.toString() || '0' },
                  { label: 'Allotted Board Details', value: profile.ssb_board || '—' },
                  { label: 'Recommended Status', value: profile.recommended_status ? '✓ Recommended Candidate' : 'No recommendations yet' },
                  { label: 'Reporting Date', value: profile.reporting_date || '—' },
                ].map(item => (
                  <div key={item.label} className="bg-white border border-[#c6c6cf]/20 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">{item.label}</p>
                    <p className="font-bold text-sm text-[#000317]">{item.value}</p>
                  </div>
                ))}
                {isOwnProfile && (
                  <div className="md:col-span-2 mt-2">
                    <button
                      onClick={() => setShowEdit(true)}
                      className="w-full py-3 border-2 border-dashed border-[#c6c6cf] rounded-2xl text-[#6B7280] hover:text-[#000317] hover:border-[#000317] text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Update SSB Profile Information
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <motion.div
                key="education"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {[
                  { icon: <GraduationCap size={18} className="text-[#000317]" />, label: 'College / University', value: profile.college, sub: profile.degree },
                  { icon: <BookOpen size={18} className="text-[#000317]" />, label: 'School', value: profile.school, sub: '' },
                ].map(item => (
                  <div key={item.label} className="bg-white border border-[#c6c6cf]/20 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{item.label}</p>
                      <p className="font-bold text-sm text-[#000317] mt-1">{item.value || '—'}</p>
                      {item.sub && <p className="text-xs text-[#6B7280] mt-0.5">{item.sub}{profile.graduation_year ? ` • Class of ${profile.graduation_year}` : ''}</p>}
                    </div>
                  </div>
                ))}
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="w-full py-3 border-2 border-dashed border-[#c6c6cf] rounded-2xl text-[#6B7280] hover:text-[#000317] hover:border-[#000317] text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Update Education Profile
                  </button>
                )}
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Profile;
