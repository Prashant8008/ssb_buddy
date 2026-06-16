import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  FileText, Send, Loader2, BookMarked,
  ChevronDown, Flame, Users, Globe, Paperclip, ExternalLink
} from 'lucide-react';
import { FeedService, AuthService, NetworkService } from '../services/api';
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

const POST_TYPE_COLORS: Record<string, string> = {
  TEXT: 'bg-navy-100 text-navy-700',
  NOTE: 'bg-blue-100 text-blue-700',
  EXPERIENCE: 'bg-green-100 text-green-700',
  CURRENT_AFFAIRS: 'bg-amber-100 text-amber-700',
};

// ── Comment Section ───────────────────────────────────────────────────────────
const CommentSection = ({ postId }: { postId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    FeedService.getComments(postId)
      .then(res => setComments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await FeedService.addComment(postId, text.trim());
      setComments(prev => [...prev, res.data]);
      setText('');
    } catch { } finally { setSubmitting(false); }
  };

  return (
    <div className="px-4 pb-4 space-y-3">
      {loading ? (
        <div className="flex justify-center py-2"><Loader2 className="animate-spin text-navy-400" size={18} /></div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.length === 0 && (
            <p className="text-xs text-navy-400 text-center py-2">No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <img src={getAvatar(c.author_username)} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
              <div className="bg-navy-50 rounded-2xl rounded-tl-none px-3 py-2 flex-1">
                <p className="text-xs font-bold text-navy-900">{c.author_username}</p>
                <p className="text-xs text-navy-700">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-navy-50 border border-navy-100 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="w-9 h-9 bg-navy-900 text-white rounded-full flex items-center justify-center hover:bg-navy-800 disabled:opacity-40 flex-shrink-0"
        >
          {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
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

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); }
    catch { return 'recently'; }
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-navy-100 flex-shrink-0 border-2 border-gold-200">
              <img
                src={post.author_avatar || getAvatar(post.author_username)}
                alt={post.author_username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${post.author_username}`}
                  className="font-bold text-sm text-navy-900 hover:text-gold-600 transition-colors"
                >
                  @{post.author_username}
                </Link>
                {post.post_type !== 'TEXT' && (
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', POST_TYPE_COLORS[post.post_type])}>
                    {post.post_type.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-400">{timeAgo}</p>
            </div>
          </div>
          <button className="text-navy-300 hover:text-navy-700 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3 space-y-1">
          {post.title && <h3 className="font-bold text-navy-900">{post.title}</h3>}
          <p className="text-sm text-navy-700 leading-relaxed">{post.body}</p>
        </div>

        {/* Uploads: image, video, document */}
        {post.image_url && (
          <div className="aspect-video bg-navy-100 overflow-hidden">
            <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
          </div>
        )}
        {post.video_url && (
          <div className="bg-navy-900">
            <video src={post.video_url} controls className="w-full max-h-96" preload="metadata">
              <track kind="captions" />
            </video>
          </div>
        )}
        {post.document_url && (
          <div className="px-4 pb-3">
            <a
              href={post.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-navy-50 border border-navy-100 hover:border-gold-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center text-gold-700">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy-900 truncate">View attachment</p>
                <p className="text-xs text-navy-500 truncate">{post.document_url}</p>
              </div>
              <ExternalLink size={16} className="text-navy-400 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-navy-50 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => onLike(post.id)}
              className={cn('flex items-center gap-1.5 text-sm font-medium transition-all', isLiked ? 'text-red-500' : 'text-navy-500 hover:text-red-400')}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likes_count}</span>
            </button>
            <button
              onClick={() => setShowComments(p => !p)}
              className={cn('flex items-center gap-1.5 text-sm font-medium transition-colors', showComments ? 'text-navy-900' : 'text-navy-500 hover:text-navy-900')}
            >
              <MessageCircle size={20} />
              <span>{post.comments_count}</span>
            </button>
            <button className="text-navy-500 hover:text-navy-900 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
          <button
            onClick={() => onSave(post.id)}
            className={cn('transition-colors', isSaved ? 'text-gold-500' : 'text-navy-400 hover:text-gold-500')}
          >
            {isSaved ? <BookMarked size={20} fill="currentColor" /> : <Bookmark size={20} />}
          </button>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-navy-50 overflow-hidden"
            >
              <CommentSection postId={post.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// ── Create Post Box ───────────────────────────────────────────────────────────
const CreatePost = ({ onCreated }: { onCreated: (post: Post) => void }) => {
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('TEXT');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const myUsername = (() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return 'me';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || 'me';
    } catch { return 'me'; }
  })();

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
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to post. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="mb-6 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-army-100 overflow-hidden flex-shrink-0 border-2 border-gold-300">
          <img src={getAvatar(myUsername)} alt="Me" className="w-full h-full" />
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setError(''); }}
            placeholder="Share your SSB experience, ask a doubt, or post notes..."
            className="w-full bg-navy-50 border border-navy-100 rounded-2xl p-3 text-sm resize-none focus:ring-2 focus:ring-gold-500 outline-none min-h-[90px] transition-all"
          />
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          {showAttach && (
            <div className="space-y-2 p-3 rounded-xl bg-navy-50 border border-navy-100">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (jpg, png, gif...)"
                className="w-full bg-white border border-navy-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-gold-500 outline-none"
              />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Video URL (mp4, webm...)"
                className="w-full bg-white border border-navy-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-gold-500 outline-none"
              />
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="Document URL (pdf, notes...)"
                className="w-full bg-white border border-navy-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowAttach((v) => !v)}
              className={cn(
                'p-2 rounded-full border transition-all',
                showAttach ? 'bg-gold-100 border-gold-300 text-gold-700' : 'border-navy-200 text-navy-500 hover:border-navy-400'
              )}
              title="Attach image, video, or document link"
            >
              <Paperclip size={16} />
            </button>
            {/* Post type selector */}
            <div className="flex gap-2">
              {(['TEXT', 'EXPERIENCE', 'NOTE', 'CURRENT_AFFAIRS'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all',
                    postType === type
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-navy-500 border-navy-200 hover:border-navy-400'
                  )}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
            </div>
            <button
              onClick={handlePost}
              disabled={submitting || (!body.trim() && !imageUrl.trim() && !videoUrl.trim() && !documentUrl.trim())}
              className="bg-navy-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-navy-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <><Loader2 className="animate-spin" size={14} /> Posting...</> : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ── Main Feed Page ────────────────────────────────────────────────────────────
const Feed = () => {
  const [feedTab, setFeedTab] = useState<FeedTab>('friends');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [myId, setMyId] = useState(() => currentUserId());
  const [connectedCount, setConnectedCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    AuthService.me()
      .then((res) => setMyId(res.data.id))
      .catch(() => setMyId(currentUserId()));
    NetworkService.getFriends()
      .then((res) => setConnectedCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setConnectedCount(0));
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
      if (replace) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(pageNum * pageSize < count);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Could not load the feed. Is the backend and MongoDB running?';
      setLoadError(msg);
      console.error('Failed to load feed:', e);
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
    try {
      const res = await FeedService.likePost(id);
      setPosts(prev => prev.map(p => p.id === id
        ? {
          ...p,
          likes_count: res.data.likes_count,
          likes: res.data.liked
            ? [...(p.likes || []), myId]
            : (p.likes || []).filter(uid => uid !== myId)
        }
        : p
      ));
    } catch { }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await FeedService.savePost(id);
      setPosts(prev => prev.map(p => p.id === id
        ? {
          ...p,
          saved_by: res.data.saved
            ? [...(p.saved_by || []), myId]
            : (p.saved_by || []).filter(uid => uid !== myId)
        }
        : p
      ));
    } catch { }
  };

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

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

  return (
    <div className="max-w-2xl mx-auto pt-20 pb-10 px-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Flame className="text-gold-500" size={22} />
          <h1 className="font-display font-bold text-xl text-navy-900">SSB Connect Feed</h1>
        </div>
        <div className="flex bg-navy-100 p-1 rounded-xl self-start">
          <button
            type="button"
            onClick={() => switchTab('friends')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all',
              feedTab === 'friends' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'
            )}
          >
            <Users size={14} /> Friends
          </button>
          <button
            type="button"
            onClick={() => switchTab('all')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all',
              feedTab === 'all' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'
            )}
          >
            <Globe size={14} /> Community
          </button>
        </div>
      </div>

      {/* Create Post */}
      <CreatePost onCreated={handleNewPost} />

      {loadError && (
        <Card className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 text-sm">
          {loadError}
        </Card>
      )}

      {feedTab === 'friends' && !loading && !loadError && connectedCount > 0 && networkPosts.length === 0 && posts.length > 0 && (
        <Card className="mb-4 p-4 border border-amber-200 bg-amber-50 text-amber-900 text-sm">
          You are connected with {connectedCount} aspirant{connectedCount === 1 ? '' : 's'}, but they have not posted yet.
          Your posts appear below — ask friends like Karan to share updates on the Community tab first.
        </Card>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-navy-400" size={36} />
          <p className="text-navy-400 text-sm font-medium">Loading {feedTab === 'friends' ? 'friends' : 'community'} feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {feedTab === 'friends' ? <Users className="text-navy-300" size={32} /> : <FileText className="text-navy-300" size={32} />}
          </div>
          <h3 className="font-bold text-navy-900 mb-2">
            {feedTab === 'friends' ? 'No posts from friends yet' : 'No posts yet'}
          </h3>
          <p className="text-sm text-navy-500 mb-4">
            {feedTab === 'friends'
              ? connectedCount === 0
                ? 'Connect with aspirants on Discover or Connections — their posts will appear here along with yours.'
                : 'Posts from connected aspirants you follow appear first, then your own posts.'
              : 'Be the first to share your SSB journey!'}
          </p>
          {feedTab === 'friends' && (
            <Link to="/map" className="text-sm font-bold text-gold-600 hover:underline">
              Discover aspirants →
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {feedTab === 'friends' && networkPosts.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-navy-400 px-1">
                From your network ({networkPosts.length})
              </p>
              {networkPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  myId={myId}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              ))}
            </>
          )}

          {feedTab === 'friends' && ownPosts.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-navy-400 px-1 pt-2">
                Your posts ({ownPosts.length})
              </p>
              {ownPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  myId={myId}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              ))}
            </>
          )}

          {feedTab === 'all' && posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              myId={myId}
              onLike={handleLike}
              onSave={handleSave}
            />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-medium text-sm py-2 px-6 rounded-full border border-navy-200 hover:border-navy-400 transition-all disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                {loadingMore ? 'Loading...' : 'Load more posts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
