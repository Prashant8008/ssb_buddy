import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  FileText, Send, Loader2, BookMarked,
  ChevronDown, Users, Globe, Paperclip, ExternalLink,
  Shield, Brain, Map, Calendar, Zap, UserPlus,
  Image as ImageIcon, Video as VideoIcon, AlignLeft,
  Rss, Cpu, MessageSquare, Activity, Group,
  Clock, Radio
} from 'lucide-react';
import { FeedService, AuthService, NetworkService, ProfileService } from '../services/api';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  author_id: number;
  author_username: string;
  author_avatar: string;
  title: string;
  body: string;
  post_type: string;
  image_url: string;
  video_url?: string;
  document_url?: string;
  likes_count: number;
  comments_count: number;
  likes: number[];
  saved_by: number[];
  created_at: string;
}

type FeedTab = 'friends' | 'all';

interface Comment {
  id: string;
  author_username: string;
  body: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getAvatar = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

const currentUserId = (): number => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return 0;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Number(payload.user_id ?? payload.sub ?? 0) || 0;
  } catch { return 0; }
};

const authorId = (post: Post) => Number(post.author_id);

const sortFriendsFeed = (posts: Post[], myId: number) => {
  const network = posts.filter((p) => authorId(p) !== myId);
  const own = posts.filter((p) => authorId(p) === myId);
  return [...network, ...own];
};

const POST_TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  TEXT:           { label: 'Post',          bg: 'bg-slate-100',           text: 'text-slate-600' },
  NOTE:           { label: 'Note',          bg: 'bg-amber-50',            text: 'text-amber-700' },
  EXPERIENCE:     { label: 'Experience',    bg: 'bg-emerald-50',          text: 'text-emerald-700' },
  CURRENT_AFFAIRS:{ label: 'Current Affairs', bg: 'bg-sky-50',           text: 'text-sky-700' },
};

// ── Comment Section ───────────────────────────────────────────────────────────
const CommentSection = ({ postId }: { postId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    FeedService.getComments(postId)
      .then(res => setComments(res.data))
      .catch(() => setError('Could not load comments.'))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await FeedService.addComment(postId, text.trim());
      setComments(prev => [...prev, res.data]);
      setText('');
    } catch {
      setError('Could not post comment. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="px-5 pb-5 pt-3 space-y-3 border-t border-slate-100">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-2"><Loader2 className="animate-spin text-slate-400" size={18} /></div>
      ) : (
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
          {comments.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <img src={getAvatar(c.author_username)} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
              <div className="bg-slate-50 rounded-2xl rounded-tl-none px-3 py-2 flex-1">
                <p className="text-[11px] font-bold text-primary">{c.author_username}</p>
                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-[#1a3560] disabled:opacity-40 flex-shrink-0 transition-colors"
        >
          {submitting ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
        </button>
      </form>
    </div>
  );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({
  post, myId, onLike, onSave
}: {
  post: Post; myId: number;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) => {
  const [showComments, setShowComments] = useState(false);
  const isLiked = post.likes?.includes(myId);
  const isSaved = post.saved_by?.includes(myId);
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.TEXT;

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); }
    catch { return 'recently'; }
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 border-l-4 border-l-secondary-fixed hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author_username}`}>
              <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-slate-100 hover:border-secondary-fixed transition-colors">
                <img
                  src={post.author_avatar || getAvatar(post.author_username)}
                  alt={post.author_username}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/profile/${post.author_username}`}
                  className="font-bold text-sm text-primary hover:underline"
                >
                  {post.author_username}
                </Link>
                {post.post_type !== 'TEXT' && (
                  <span className={cn(
                    'text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider',
                    typeConfig.bg, typeConfig.text
                  )}>
                    {typeConfig.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-700 transition-colors p-1">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-3">
          {post.title && <h3 className="font-bold text-primary text-base mb-1">{post.title}</h3>}
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </div>

        {/* Media */}
        {post.image_url && (
          <div className="mx-5 mb-4 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
            <img src={post.image_url} alt="Post" className="w-full object-cover max-h-80" />
          </div>
        )}
        {post.video_url && (
          <div className="mx-5 mb-4 rounded-lg overflow-hidden bg-primary">
            <video src={post.video_url} controls className="w-full max-h-80" preload="metadata">
              <track kind="captions" />
            </video>
          </div>
        )}
        {post.document_url && (
          <div className="px-5 pb-4">
            <a
              href={post.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-secondary-fixed transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary-fixed/20 flex items-center justify-center text-[#785d00]">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary truncate">View Attachment</p>
                <p className="text-[10px] text-slate-400 truncate">{post.document_url}</p>
              </div>
              <ExternalLink size={13} className="text-slate-400 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => onLike(post.id)}
              className={cn('flex items-center gap-1.5 text-xs font-semibold transition-all',
                isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-400')}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likes_count}</span>
            </button>
            <button
              onClick={() => setShowComments(p => !p)}
              className={cn('flex items-center gap-1.5 text-xs font-semibold transition-colors',
                showComments ? 'text-primary' : 'text-slate-500 hover:text-primary')}
            >
              <MessageCircle size={16} />
              <span>{post.comments_count}</span>
            </button>
            <button className="text-slate-500 hover:text-primary transition-colors text-xs font-semibold flex items-center gap-1.5">
              <Share2 size={16} />
            </button>
          </div>
          <button
            onClick={() => onSave(post.id)}
            className={cn('transition-colors', isSaved ? 'text-secondary-fixed' : 'text-slate-400 hover:text-secondary-fixed')}
          >
            {isSaved ? <BookMarked size={16} fill="currentColor" /> : <Bookmark size={16} />}
          </button>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CommentSection postId={post.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Create Post Box ───────────────────────────────────────────────────────────
const CreatePost = ({ onCreated, myUsername }: { onCreated: (post: Post) => void; myUsername: string }) => {
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('TEXT');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!body.trim() && !imageUrl.trim() && !videoUrl.trim() && !documentUrl.trim()) {
      setError('Please write something or attach a file link.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await FeedService.createPost({
        body: body.trim(),
        post_type: postType,
        ...(imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
        ...(videoUrl.trim() ? { video_url: videoUrl.trim() } : {}),
        ...(documentUrl.trim() ? { document_url: documentUrl.trim() } : {}),
      });
      onCreated(res.data);
      setBody('');
      setImageUrl('');
      setVideoUrl('');
      setDocumentUrl('');
      setShowAttach(false);
      setExpanded(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to post. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      {/* Composer row */}
      <div className="p-4 flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-100">
          <img src={getAvatar(myUsername)} alt="Me" className="w-full h-full object-cover" />
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 text-left bg-slate-100 hover:bg-slate-200 transition-colors rounded-full px-4 py-2.5 text-sm text-slate-400"
        >
          What's on your mind?
        </button>
      </div>

      {/* Expanded composer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4 space-y-3">
              <textarea
                value={body}
                onChange={e => { setBody(e.target.value); setError(''); }}
                placeholder="Share your SSB experience, ask a doubt, or post notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm resize-none focus:ring-1 focus:ring-primary outline-none min-h-[80px] text-slate-700"
                autoFocus
              />
              {error && <p className="text-xs text-red-500">{error}</p>}

              {showAttach && (
                <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  {[
                    { val: imageUrl, set: setImageUrl, ph: 'Image URL (jpg, png, gif...)' },
                    { val: videoUrl, set: setVideoUrl, ph: 'Video URL (mp4, webm...)' },
                    { val: documentUrl, set: setDocumentUrl, ph: 'Document URL (pdf, notes...)' },
                  ].map(({ val, set, ph }) => (
                    <input
                      key={ph}
                      type="url"
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={ph}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {(['TEXT', 'EXPERIENCE', 'NOTE', 'CURRENT_AFFAIRS'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setPostType(type)}
                      className={cn(
                        'text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all uppercase tracking-wider',
                        postType === type
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-primary'
                      )}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAttach(v => !v)}
                    className={cn('p-1.5 rounded-full border transition-all', showAttach ? 'bg-secondary-fixed/20 border-secondary-fixed text-[#785d00]' : 'border-slate-200 text-slate-400 hover:border-primary')}
                  >
                    <Paperclip size={13} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setExpanded(false); setBody(''); setError(''); }}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={submitting || (!body.trim() && !imageUrl.trim() && !videoUrl.trim() && !documentUrl.trim())}
                    className="px-5 py-1.5 bg-primary hover:bg-[#1a3560] text-white rounded-full text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {submitting ? <><Loader2 className="animate-spin" size={12} /> Posting...</> : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick action buttons */}
      <div className="px-4 pb-3 flex gap-1">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 text-xs font-semibold"
        >
          <ImageIcon size={16} className="text-emerald-500" /> Photo
        </button>
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 text-xs font-semibold"
        >
          <VideoIcon size={16} className="text-sky-500" /> Video
        </button>
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 text-xs font-semibold"
        >
          <AlignLeft size={16} className="text-amber-500" /> Article
        </button>
      </div>
    </div>
  );
};

// ── Main Feed Page ────────────────────────────────────────────────────────────
const Feed = () => {
  const navigate = useNavigate();
  const [feedTab, setFeedTab] = useState<FeedTab>('friends');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [myId, setMyId] = useState(() => currentUserId());
  const [myProfile, setMyProfile] = useState<{
    username: string;
    entry_type: string;
    attempts: number;
    connectionsCount: number;
    points: string;
    batch: string;
  }>({
    username: 'aspirant',
    entry_type: 'NDA',
    attempts: 0,
    connectionsCount: 842,
    points: '2.4k',
    batch: '2024',
  });

  const pageSize = 20;

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const meRes = await AuthService.me();
        const me = meRes.data;
        setMyId(me.id);

        const profileRes = await ProfileService.getMe();
        const prof = profileRes.data;

        const connRes = await NetworkService.getFriends();
        const conns = Array.isArray(connRes.data) ? connRes.data.length : 842;

        const year = prof.graduation_year || new Date().getFullYear();

        setMyProfile({
          username: me.username,
          entry_type: prof.entry_type || 'NDA',
          attempts: prof.ssb_attempts || 0,
          connectionsCount: conns,
          points: prof.ssb_attempts > 0 ? `${Math.max(1.0, 2.4 - (prof.ssb_attempts * 0.2)).toFixed(1)}k` : '2.4k',
          batch: String(year),
        });
      } catch (err) {
        console.error('Failed to load user metadata on Feed:', err);
      }
    };
    fetchMetadata();
  }, []);

  const loadPosts = async (pageNum: number, tab: FeedTab, replace = false) => {
    if (replace) setLoadError(null);
    try {
      const res = await FeedService.getPosts(pageNum, { feed: tab });
      const data = res.data;
      let newPosts: Post[] = data.results || data;
      const count = data.count ?? newPosts.length;
      if (tab === 'friends' && myId) {
        newPosts = sortFriendsFeed(newPosts, myId);
      }
      if (replace) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(pageNum * pageSize < count);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Could not load the feed.';
      setLoadError(msg);
      if (replace) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setLoading(true);
    loadPosts(1, feedTab, true);
  }, [feedTab, myId]);

  const handleLike = async (id: string) => {
    const prev = posts.find(p => p.id === id);
    if (!prev) return;
    try {
      const res = await FeedService.likePost(id);
      setActionError(null);
      setPosts(prevPosts => prevPosts.map(p => p.id === id
        ? { ...p, likes_count: res.data.likes_count, likes: res.data.liked ? [...(p.likes || []), myId] : (p.likes || []).filter(uid => uid !== myId) }
        : p
      ));
    } catch {
      setActionError('Could not update like.');
    }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await FeedService.savePost(id);
      setActionError(null);
      setPosts(prev => prev.map(p => p.id === id
        ? { ...p, saved_by: res.data.saved ? [...(p.saved_by || []), myId] : (p.saved_by || []).filter(uid => uid !== myId) }
        : p
      ));
    } catch {
      setActionError('Could not save post.');
    }
  };

  const handleNewPost = (post: Post) => setPosts(prev => [post, ...prev]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, feedTab);
  };

  const switchTab = (tab: FeedTab) => {
    if (tab === feedTab) return;
    setFeedTab(tab);
  };

  const networkPosts = feedTab === 'friends' ? posts.filter((p) => authorId(p) !== myId) : posts;
  const ownPosts = feedTab === 'friends' ? posts.filter((p) => authorId(p) === myId) : [];

  // Nav items for left sidebar
  const navItems = [
    { icon: <Rss size={17} />, label: 'Feed', path: '/feed' },
    { icon: <Shield size={17} />, label: 'SSB Hub', path: '/ssb' },
    { icon: <MessageSquare size={17} />, label: 'Messaging', path: '/chat' },
    { icon: <Map size={17} />, label: 'Map', path: '/map' },
    { icon: <Activity size={17} />, label: 'Fitness', path: '/fitness' },
    { icon: <Users size={17} />, label: 'Groups', path: '/groups' },
    { icon: <Calendar size={17} />, label: 'Events', path: '/events' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left Sidebar (col-span-3) ── */}
          <aside className="lg:col-span-3 space-y-4">

            {/* Profile Card */}
            <div className="ssb-card">
              {/* Cover — overflow-hidden here only, so avatar isn't clipped */}
              <div className="h-24 bg-gradient-to-br from-primary to-[#1a3560] relative rounded-t-xl overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, secondary-fixed 0%, transparent 60%)' }} />
              </div>
              {/* Avatar — sits outside the cover, overlapping it */}
              <div className="flex justify-center -mt-11 mb-2 relative z-10">
                <div className="w-[88px] h-[88px] rounded-full border-4 border-white overflow-hidden shadow-lg bg-slate-100">
                  <img src={getAvatar(myProfile.username)} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              {/* Identity */}
              <div className="text-center pb-4 px-4">
                <h2 className="font-bold text-primary text-base">{myProfile.entry_type} Aspirant</h2>
                <p className="text-xs text-slate-400 mt-0.5">Batch of {myProfile.batch}</p>
                {/* Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-around">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Connections</p>
                    <p className="font-bold text-sm text-primary mt-0.5">{myProfile.connectionsCount}</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Hub Points</p>
                    <p className="font-bold text-sm text-secondary-fixed mt-0.5">{myProfile.points}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
              {navItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    item.label === 'Feed'
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                  )}
                >
                  <span className={item.label === 'Feed' ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Practice Mode CTA */}
            <div className="bg-primary rounded-xl p-5 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-fixed/70 mb-1">Daily Drill</p>
                <h3 className="text-base font-bold text-secondary-fixed">Practice Mode</h3>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Sharpen your OLQs daily.</p>
                <Link
                  to="/ssb"
                  className="mt-4 w-full bg-secondary-fixed hover:bg-[#e0c060] text-primary font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center transition-all"
                >
                  Start Practice
                </Link>
              </div>
              <Brain className="absolute bottom-0 right-0 w-24 h-24 text-white/5 translate-x-4 translate-y-4 pointer-events-none" />
            </div>
          </aside>

          {/* ── Center Feed (col-span-6) ── */}
          <section className="lg:col-span-6 space-y-4">
            {/* Post Composer */}
            <CreatePost onCreated={handleNewPost} myUsername={myProfile.username} />

            {/* Feed Filter Tabs */}
            <div className="flex gap-2 bg-white rounded-xl shadow-sm border border-slate-100 p-1.5">
              {(['friends', 'all'] as FeedTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                    feedTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-500 hover:text-primary'
                  )}
                >
                  {tab === 'friends' ? 'Friends' : 'All Aspirants'}
                </button>
              ))}
            </div>

            {/* Errors */}
            {loadError && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-xl">{loadError}</div>
            )}
            {actionError && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-xl flex justify-between">
                <span>{actionError}</span>
                <button onClick={() => setActionError(null)} className="font-bold">✕</button>
              </div>
            )}

            {/* Posts */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-secondary-fixed" size={32} />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
                <Users className="text-slate-200 mx-auto mb-3" size={36} />
                <h3 className="font-bold text-primary mb-1">No posts yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {feedTab === 'friends'
                    ? 'Connect with aspirants to see their updates here.'
                    : 'No posts shared yet. Be the first to post!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedTab === 'friends' && networkPosts.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                      From Your Network
                    </p>
                    {networkPosts.map(post => (
                      <PostCard key={post.id} post={post} myId={myId} onLike={handleLike} onSave={handleSave} />
                    ))}
                  </>
                )}

                {feedTab === 'friends' && ownPosts.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 pt-2">
                      Your Posts
                    </p>
                    {ownPosts.map(post => (
                      <PostCard key={post.id} post={post} myId={myId} onLike={handleLike} onSave={handleSave} />
                    ))}
                  </>
                )}

                {feedTab === 'all' && posts.map(post => (
                  <PostCard key={post.id} post={post} myId={myId} onLike={handleLike} onSave={handleSave} />
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary font-bold uppercase tracking-wider py-2.5 px-6 rounded-full border border-slate-200 hover:border-primary transition-all bg-white shadow-sm disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="animate-spin" size={13} /> : <ChevronDown size={13} />}
                      {loadingMore ? 'Loading...' : 'Load More Posts'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Right Sidebar (col-span-3) ── */}
          <aside className="lg:col-span-3 space-y-4">

            {/* Suggested Connections */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-primary mb-3">Suggested Connections</h3>
              <div className="space-y-3">
                {[
                  { name: 'Rahul Mehra', role: 'CDS Aspirant', seed: 'rahulmehra' },
                  { name: 'Priya Sharma', role: 'Navy Tech Entry', seed: 'priyasharma' },
                ].map(({ name, role, seed }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img className="w-10 h-10 rounded-full border-2 border-slate-100" src={getAvatar(seed)} alt="" />
                      <div>
                        <p className="font-bold text-xs text-primary">{name}</p>
                        <p className="text-[10px] text-slate-400">{role}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary hover:bg-slate-50 transition-all">
                      <UserPlus size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <Link
                to="/map"
                className="mt-4 w-full border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider py-2 rounded-lg flex items-center justify-center hover:border-primary hover:text-primary transition-all"
              >
                View All
              </Link>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-primary mb-3">Upcoming Events</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-secondary-fixed w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center">
                    <span className="text-[7px] font-bold uppercase tracking-wider">OCT</span>
                    <span className="text-base font-extrabold leading-none">12</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-primary line-clamp-1">GTO Task Mock Drill</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">10:00 AM • Zoom Meet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-secondary-fixed/10 text-[#785d00] w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center border border-secondary-fixed/20">
                    <span className="text-[7px] font-bold uppercase tracking-wider">OCT</span>
                    <span className="text-base font-extrabold leading-none">15</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-primary line-clamp-1">Interview Prep with Col....</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">06:00 PM • Live</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Practice */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-primary mb-3">Quick Practice</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Clock size={20} />, label: 'OIR Test', path: '/ssb' },
                  { icon: <AlignLeft size={20} />, label: 'TAT/WAT', path: '/ssb' },
                  { icon: <Users size={20} />, label: 'GD Topics', path: '/ssb' },
                  { icon: <Radio size={20} />, label: 'Lecturette', path: '/ssb' },
                ].map(({ icon, label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border border-slate-100 hover:border-secondary-fixed hover:bg-secondary-fixed/5 transition-all text-center group"
                  >
                    <span className="text-slate-500 group-hover:text-primary transition-colors">{icon}</span>
                    <p className="text-[10px] font-bold text-slate-600 group-hover:text-primary transition-colors">{label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="px-1">
              <p className="text-[9px] text-slate-400 leading-relaxed">
                <Link to="#" className="hover:underline">About</Link> · {' '}
                <Link to="#" className="hover:underline">Privacy</Link> · {' '}
                <Link to="#" className="hover:underline">Terms</Link> · {' '}
                <Link to="#" className="hover:underline">Help Center</Link>
              </p>
              <p className="text-[9px] text-slate-300 mt-1">© 2024 SSB CONNECT • FOR THE BRAVE</p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default Feed;
