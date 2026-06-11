import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Clock, Loader2, Check, X } from 'lucide-react';
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
    { id: 'incoming' as const, label: 'Requests', count: incoming.length, icon: <UserPlus size={16} /> },
    { id: 'sent' as const, label: 'Sent', count: sent.length, icon: <Clock size={16} /> },
    { id: 'friends' as const, label: 'Connected', count: friends.length, icon: <Users size={16} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto pt-20 pb-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-navy-900">Connections</h1>
        <p className="text-sm text-navy-500 mt-1">
          Manage friend requests and stay connected with fellow aspirants.
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
              tab === t.id
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-white text-navy-600 border border-navy-100 hover:border-navy-300'
            )}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                tab === t.id ? 'bg-gold-500 text-navy-900' : 'bg-navy-100 text-navy-600'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-navy-400" size={32} />
        </div>
      ) : tab === 'incoming' ? (
        incoming.length === 0 ? (
          <Card className="p-12 text-center">
            <UserPlus className="mx-auto text-navy-300 mb-3" size={36} />
            <p className="text-navy-500 text-sm">No pending requests right now.</p>
            <Link to="/map" className="text-gold-600 text-sm font-bold hover:underline mt-2 inline-block">
              Discover aspirants nearby
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => (
              <Card key={req.id} className="p-4 flex items-center gap-4">
                <img src={getAvatar(req.from_user.username)} alt="" className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${req.from_user.username}`} className="font-bold text-navy-900 hover:underline">
                    {displayName(req.from_user)}
                  </Link>
                  <p className="text-xs text-navy-500">@{req.from_user.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(req.id, 'ACCEPTED')}
                    disabled={actingId === req.id}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {actingId === req.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(req.id, 'DECLINED')}
                    disabled={actingId === req.id}
                    className="p-2 bg-navy-100 text-navy-600 rounded-lg hover:bg-navy-200 disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'sent' ? (
        sent.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="mx-auto text-navy-300 mb-3" size={36} />
            <p className="text-navy-500 text-sm">You haven&apos;t sent any connection requests yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sent.map((req) => (
              <Card key={req.id} className="p-4 flex items-center gap-4">
                <img src={getAvatar(req.to_user.username)} alt="" className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Link to={`/profile/${req.to_user.username}`} className="font-bold text-navy-900 hover:underline">
                    {displayName(req.to_user)}
                  </Link>
                  <p className="text-xs text-navy-500">@{req.to_user.username} · Pending</p>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : friends.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto text-navy-300 mb-3" size={36} />
          <p className="text-navy-500 text-sm">No connections yet. Send requests from aspirant profiles.</p>
          <Link to="/map" className="text-gold-600 text-sm font-bold hover:underline mt-2 inline-block">
            Find aspirants
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((friend) => (
            <Card key={friend.id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <img src={getAvatar(friend.username)} alt="" className="w-12 h-12 rounded-full" />
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${friend.username}`} className="font-bold text-navy-900 hover:underline truncate block">
                  {displayName(friend)}
                </Link>
                <p className="text-xs text-navy-500">@{friend.username}</p>
              </div>
              <Link
                to={`/chat?user=${friend.id}`}
                className="text-xs font-bold text-gold-600 hover:underline flex-shrink-0"
              >
                Message
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;
