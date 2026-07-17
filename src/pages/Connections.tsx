import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Clock, Loader2, Check, X, Search } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { NetworkService, AuthService } from '../services/api';

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface FriendRequest {
  id: number;
  status: string;
  from_user: ApiUser;
  to_user: ApiUser;
  created_at: string;
}

const getAvatar = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

const displayName = (user: ApiUser) =>
  user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;

const Connections = () => {
  const [tab, setTab] = useState<'incoming' | 'sent' | 'friends'>('incoming');
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, friendsRes] = await Promise.all([
        NetworkService.getFriendRequests('PENDING'),
        NetworkService.getFriends(),
      ]);
      const pending: FriendRequest[] = pendingRes.data.results ?? pendingRes.data;
      const meRes = await AuthService.me();
      const myId = meRes.data.id;

      setIncoming(pending.filter((r) => r.to_user.id === myId));
      setSent(pending.filter((r) => r.from_user.id === myId));
      setFriends(friendsRes.data);
    } catch (e) {
      console.error('Failed to load connections:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id: number, status: 'ACCEPTED' | 'DECLINED') => {
    setActingId(id);
    try {
      await NetworkService.respondToFriendRequest(id, status);
      await load();
    } catch (e) {
      console.error('Failed to respond:', e);
    } finally {
      setActingId(null);
    }
  };

  const tabs = [
    { id: 'incoming' as const, label: 'Pending Requests', count: incoming.length, icon: <UserPlus size={16} /> },
    { id: 'sent' as const, label: 'Sent', count: sent.length, icon: <Clock size={16} /> },
    { id: 'friends' as const, label: 'Connected', count: friends.length, icon: <Users size={16} /> },
  ];

  const filteredFriends = friends.filter((f) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return f.username.toLowerCase().includes(q) || displayName(f).toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto pt-20 pb-24 px-4 md:px-8 sm:pb-10 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="ssb-page-title">Connections</h1>
        <p className="ssb-page-sub">
          Discover aspirants, manage requests, and grow your preparation network.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search aspirants by name or username..."
          className="ssb-input w-full pl-11"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all',
              tab === t.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface text-on-surface-variant border border-outline-variant/30 hover:border-primary/30'
            )}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                tab === t.id ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-secondary-fixed" size={32} />
        </div>
      ) : tab === 'incoming' ? (
        incoming.length === 0 ? (
          <Card className="p-12 text-center">
            <UserPlus className="mx-auto text-outline-variant mb-3" size={36} />
            <p className="text-text-secondary text-sm">No pending requests right now.</p>
            <Link to="/map" className="text-secondary text-sm font-bold hover:underline mt-2 inline-block">
              Discover aspirants nearby
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => (
              <Card key={req.id} className="p-4 flex items-center gap-4">
                <img src={getAvatar(req.from_user.username)} alt="" className="w-14 h-14 rounded-full border-2 border-secondary-fixed/30" />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${req.from_user.username}`} className="font-bold text-primary hover:underline">
                    {displayName(req.from_user)}
                  </Link>
                  <p className="text-xs text-text-secondary">@{req.from_user.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(req.id, 'ACCEPTED')}
                    disabled={actingId === req.id}
                    className="px-4 py-2 bg-tertiary-fixed/30 text-tertiary-container rounded-full text-xs font-bold hover:bg-tertiary-fixed/50 disabled:opacity-50 flex items-center gap-1"
                  >
                    {actingId === req.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(req.id, 'DECLINED')}
                    disabled={actingId === req.id}
                    className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-full text-xs font-bold hover:bg-surface-container disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'sent' ? (
        sent.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="mx-auto text-outline-variant mb-3" size={36} />
            <p className="text-text-secondary text-sm">You haven&apos;t sent any connection requests yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sent.map((req) => (
              <Card key={req.id} className="p-4 flex items-center gap-4">
                <img src={getAvatar(req.to_user.username)} alt="" className="w-12 h-12 rounded-full border border-outline-variant/30" />
                <div className="flex-1">
                  <Link to={`/profile/${req.to_user.username}`} className="font-bold text-primary hover:underline">
                    {displayName(req.to_user)}
                  </Link>
                  <p className="text-xs text-text-secondary">@{req.to_user.username} · Pending</p>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredFriends.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto text-outline-variant mb-3" size={36} />
          <p className="text-text-secondary text-sm">No connections yet. Send requests from aspirant profiles.</p>
          <Link to="/map" className="text-secondary text-sm font-bold hover:underline mt-2 inline-block">
            Find aspirants
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => (
            <Card key={friend.id} className="p-5 flex flex-col items-center text-center card-hover connection-card">
              <img src={getAvatar(friend.username)} alt="" className="w-20 h-20 rounded-full border-2 border-secondary-fixed/40 mb-3" />
              <Link to={`/profile/${friend.username}`} className="font-bold text-primary hover:underline">
                {displayName(friend)}
              </Link>
              <p className="text-xs text-text-secondary mb-3">@{friend.username}</p>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant mb-4">
                Aspirant
              </span>
              <div className="flex gap-2 w-full">
                <Link
                  to={`/profile/${friend.username}`}
                  className="flex-1 py-2 text-center border border-primary text-primary rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-colors"
                >
                  Profile
                </Link>
                <Link
                  to={`/chat?user=${friend.id}`}
                  className="flex-1 py-2 text-center ssb-btn-primary text-[10px]"
                >
                  Message
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;
