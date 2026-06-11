import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, GraduationCap, Shield, Award, Edit3,
  Share2, CheckCircle2, Trophy, Grid, Heart,
  Loader2, Save, X, MessageCircle, FileText, ExternalLink, ChevronDown
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
      // Convert empty strings to null for numeric fields (Django rejects '' for IntegerFields)
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
      // Show field-level validation errors from DRF
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-navy-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-display font-bold text-navy-900 text-lg">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-50 rounded-xl transition-colors">
            <X size={20} className="text-navy-600" />
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
            <label className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell your SSB story..."
              rows={3}
              className="w-full bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2 block">Location</label>
            <div className="grid grid-cols-3 gap-3">
              {['city', 'state', 'country'].map(field => (
                <input
                  key={field}
                  value={(form as any)[field]}
                  onChange={e => set(field, e.target.value)}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              ))}
            </div>
          </div>

          {/* Personal */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2 block">Personal</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="Age"
                className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
                className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value="">Select Gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* SSB Info */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2 block">SSB Information</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.entry_type}
                onChange={e => set('entry_type', e.target.value)}
                className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value="">Entry Type</option>
                {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={form.preferred_service}
                onChange={e => set('preferred_service', e.target.value)}
                className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
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
                className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
              <input
                value={form.ssb_board}
                onChange={e => set('ssb_board', e.target.value)}
                placeholder="SSB Board (e.g. Allahabad 14 SSB)"
                className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2 block">Education</label>
            <div className="space-y-3">
              <input
                value={form.school}
                onChange={e => set('school', e.target.value)}
                placeholder="School name"
                className="w-full bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.college}
                  onChange={e => set('college', e.target.value)}
                  placeholder="College / University"
                  className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
                <input
                  value={form.degree}
                  onChange={e => set('degree', e.target.value)}
                  placeholder="Degree (e.g. B.Tech)"
                  className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>
              <input
                type="number"
                value={form.graduation_year}
                onChange={e => set('graduation_year', e.target.value)}
                placeholder="Graduation Year (e.g. 2025)"
                className="w-full bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-navy-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-navy-200 text-navy-700 font-bold text-sm hover:bg-navy-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
    { id: 'posts', label: 'Posts', icon: <Grid size={18} /> },
    { id: 'ssb', label: 'SSB Info', icon: <Shield size={18} /> },
    { id: 'education', label: 'Education', icon: <GraduationCap size={18} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-gold-500" size={40} />
          <p className="text-navy-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load profile. Please refresh.</p>
      </div>
    );
  }

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-10 px-4">

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEdit(false)}
            onSaved={(p) => setProfile(p)}
          />
        )}
      </AnimatePresence>

      {/* Header Card */}
      <Card className="relative mb-6 overflow-hidden">
        {/* Cover */}
        <div className="h-48 w-full bg-gradient-to-r from-navy-900 via-navy-800 to-army-900 overflow-hidden">
          {profile.cover_photo && (
            <img src={profile.cover_photo} className="w-full h-full object-cover opacity-60" alt="Cover" />
          )}
          <div className="absolute inset-0 h-48 bg-gradient-to-b from-transparent to-black/30" />
        </div>

        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-xl">
                <img
                  src={profile.profile_picture || getAvatar(user.username)}
                  className="w-full h-full object-cover"
                  alt="Avatar"
                />
              </div>
              {profile.recommended_status && (
                <div className="absolute -bottom-2 -right-2 bg-gold-500 p-1.5 rounded-lg border-2 border-white shadow">
                  <Shield size={16} className="text-navy-900" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-end">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-bold hover:bg-navy-800 transition-colors shadow-sm"
                  >
                    <Edit3 size={16} /> Edit Profile
                  </button>
                  <button className="p-2 bg-navy-50 text-navy-600 rounded-xl hover:bg-navy-100 transition-colors">
                    <Share2 size={18} />
                  </button>
                </>
              ) : user && connection && (
                <ConnectActions
                  userId={user.id}
                  username={user.username}
                  connection={connection}
                  onConnectionChange={setConnection}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {/* Name */}
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-navy-900">{fullName}</h1>
                {user.is_email_verified && <CheckCircle2 size={20} className="text-gold-500" />}
              </div>
              <p className="text-navy-500 font-medium">@{user.username}</p>

              {/* Bio */}
              {profile.bio ? (
                <p className="mt-3 text-navy-800 leading-relaxed max-w-xl">{profile.bio}</p>
              ) : isOwnProfile ? (
                <button
                  onClick={() => setShowEdit(true)}
                  className="mt-3 text-sm text-navy-400 italic hover:text-gold-500 transition-colors"
                >
                  + Add a bio to tell your SSB story
                </button>
              ) : null}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-navy-600">
                {location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-army-500" /> {location}
                  </div>
                )}
                {profile.entry_type && (
                  <div className="flex items-center gap-1.5">
                    <Shield size={15} className="text-navy-500" /> {profile.entry_type} Aspirant
                  </div>
                )}
                {profile.preferred_service && (
                  <div className="flex items-center gap-1.5">
                    <Trophy size={15} className="text-gold-600" /> {profile.preferred_service.replace('_', ' ')}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-navy-400" />
                  Joined {new Date().getFullYear()}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-navy-50 rounded-2xl p-4 flex items-center">
              <div className={cn('grid gap-4 text-center w-full', isOwnProfile ? 'grid-cols-3' : 'grid-cols-4')}>
                <div>
                  <p className="text-xl font-bold text-navy-900">{posts.length}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-navy-400">Posts</p>
                </div>
                {!isOwnProfile && connection && (
                  <>
                    <div>
                      <p className="text-xl font-bold text-navy-900">{connection.followers_count}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-navy-400">Followers</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-navy-900">{connection.following_count}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-navy-400">Following</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-xl font-bold text-navy-900">{profile.ssb_attempts}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-navy-400">SSB Attempts</p>
                </div>
                {isOwnProfile && (
                  <div>
                    <p className="text-xl font-bold text-navy-900">
                      {profile.recommended_status ? '✓' : '–'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-navy-400">Recommended</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-navy-100 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap',
              activeTab === tab.id
                ? 'border-gold-500 text-navy-900'
                : 'border-transparent text-navy-400 hover:text-navy-600'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {postsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-navy-400" size={28} />
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <Grid className="text-navy-200 mx-auto mb-3" size={40} />
                <p className="font-bold text-navy-700">No posts yet</p>
                <p className="text-sm text-navy-400 mt-1">
                  {isOwnProfile
                    ? 'Share your first SSB experience from the Feed!'
                    : `${fullName} hasn't posted anything yet.`}
                </p>
              </Card>
            ) : (
              <>
                {posts.map(post => (
                  <Card key={post.id} className="p-4 overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={profile.profile_picture || getAvatar(user.username)}
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                      <div>
                        <p className="text-sm font-bold text-navy-900">{post.title || post.post_type}</p>
                        <p className="text-[10px] text-navy-400">
                          {(() => { try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); } catch { return ''; } })()}
                        </p>
                      </div>
                      {post.post_type !== 'TEXT' && (
                        <span className="ml-auto text-[10px] font-bold bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full">
                          {post.post_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {post.body && (
                      <p className="text-sm text-navy-700 leading-relaxed mb-3">{post.body}</p>
                    )}
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="rounded-xl w-full object-cover max-h-80 mb-3" />
                    )}
                    {post.video_url && (
                      <video src={post.video_url} controls className="rounded-xl w-full max-h-80 mb-3" preload="metadata">
                        <track kind="captions" />
                      </video>
                    )}
                    {post.document_url && (
                      <a
                        href={post.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-navy-50 border border-navy-100 hover:border-gold-400 transition-colors mb-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gold-100 flex items-center justify-center text-gold-700">
                          <FileText size={18} />
                        </div>
                        <span className="text-sm font-bold text-navy-900 flex-1 truncate">Open attachment</span>
                        <ExternalLink size={14} className="text-navy-400" />
                      </a>
                    )}
                    <div className="flex items-center gap-5 text-navy-400">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Heart size={15} /> {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs">
                        <MessageCircle size={15} /> {post.comments_count}
                      </span>
                    </div>
                  </Card>
                ))}
                {postsHasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadMorePosts}
                      disabled={postsLoadingMore}
                      className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-medium text-sm py-2 px-6 rounded-full border border-navy-200 hover:border-navy-400 disabled:opacity-50"
                    >
                      {postsLoadingMore ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                      {postsLoadingMore ? 'Loading...' : 'Load more posts'}
                    </button>
                  </div>
                )}
              </>
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
              { label: 'Entry Type', value: profile.entry_type || '—' },
              { label: 'Preferred Service', value: profile.preferred_service?.replace('_', ' ') || '—' },
              { label: 'SSB Attempts', value: profile.ssb_attempts?.toString() || '0' },
              { label: 'SSB Board', value: profile.ssb_board || '—' },
              { label: 'Recommended', value: profile.recommended_status ? '✅ Yes' : '❌ Not Yet' },
              { label: 'Reporting Date', value: profile.reporting_date || '—' },
            ].map(item => (
              <Card key={item.label} className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-1">{item.label}</p>
                <p className="font-bold text-navy-900">{item.value}</p>
              </Card>
            ))}
            <div className="md:col-span-2">
              <button
                onClick={() => setShowEdit(true)}
                className="w-full py-3 border-2 border-dashed border-navy-200 rounded-xl text-navy-500 text-sm font-medium hover:border-gold-400 hover:text-gold-500 transition-all"
              >
                + Update SSB Information
              </button>
            </div>
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
              { icon: <GraduationCap size={20} className="text-army-500" />, label: 'College / University', value: profile.college, sub: profile.degree },
              { icon: <GraduationCap size={20} className="text-navy-400" />, label: 'School', value: profile.school, sub: '' },
            ].map(item => (
              <Card key={item.label} className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400">{item.label}</p>
                  <p className="font-bold text-navy-900 mt-1">{item.value || '—'}</p>
                  {item.sub && <p className="text-sm text-navy-500">{item.sub}{profile.graduation_year ? ` • ${profile.graduation_year}` : ''}</p>}
                </div>
              </Card>
            ))}
            <button
              onClick={() => setShowEdit(true)}
              className="w-full py-3 border-2 border-dashed border-navy-200 rounded-xl text-navy-500 text-sm font-medium hover:border-gold-400 hover:text-gold-500 transition-all"
            >
              + Add / Edit Education
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
