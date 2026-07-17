import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Users, Search, Plus, Globe, Lock, Loader2, X, UserCheck, Clock, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { GroupService, NetworkService, ProfileService } from '../services/api';

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface StudyGroup {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  state: string;
  is_private: boolean;
  members_count: number;
  is_member?: boolean;
  my_role?: string | null;
  pending_join_request?: boolean;
  pending_requests_count?: number;
}

interface JoinRequest {
  id: number;
  group: number;
  group_name: string;
  user: ApiUser;
  status: string;
  created_at: string;
}

const CATEGORIES = ['', 'NDA', 'CDS', 'AFCAT', 'SSB', 'ARMY', 'NAVY', 'AIR_FORCE'];

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
  '-' + Date.now().toString(36);

const displayName = (user: ApiUser) =>
  user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

const Groups = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [profileHint, setProfileHint] = useState('');
  const [manageGroup, setManageGroup] = useState<StudyGroup | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, profileRes] = await Promise.all([
        GroupService.list({
          search: search.trim() || undefined,
          category: category || undefined,
        }),
        ProfileService.getMe().catch(() => null),
      ]);
      const data: StudyGroup[] = groupsRes.data.results ?? groupsRes.data;
      setGroups(Array.isArray(data) ? data : []);
      if (profileRes?.data) {
        const p = profileRes.data;
        const parts = [p.entry_type, p.ssb_board, p.city].filter(Boolean);
        if (parts.length) setProfileHint(parts.join(' · '));
      }
    } catch (e) {
      console.error('Failed to load groups:', e);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(loadGroups, 300);
    return () => clearTimeout(t);
  }, [loadGroups]);

  const handleJoin = async (group: StudyGroup) => {
    setJoiningId(group.id);
    setActionMsg('');
    try {
      const res = await GroupService.join(group.id);
      if (res.data.requested) {
        setActionMsg(`Request sent to join "${group.name}". The owner will review it.`);
      } else {
        setActionMsg(`You joined "${group.name}".`);
      }
      await loadGroups();
    } catch (e: any) {
      setActionMsg(e.response?.data?.detail || 'Could not join this group.');
    } finally {
      setJoiningId(null);
    }
  };

  const getJoinLabel = (group: StudyGroup) => {
    if (group.is_member || group.my_role) return 'Joined';
    if (group.pending_join_request) return 'Request Pending';
    if (group.is_private) return 'Request to Join';
    return 'Join Group';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="ssb-page-title">Study Groups</h1>
          <p className="ssb-page-sub">Connect with aspirants preparing for the same entry.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="ssb-btn-gold px-6 py-3 flex items-center gap-2 self-start md:self-center"
        >
          <Plus size={18} /> Create Group
        </button>
      </div>

      {actionMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-accent-50 border border-accent-100 text-sm text-accent-800">
          {actionMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-primary mb-4">Categories</h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat || 'all'}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    category === cat
                      ? 'bg-primary text-white'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  )}
                >
                  {cat || 'All Groups'}
                </button>
              ))}
            </div>
          </Card>

          {profileHint && (
            <Card className="p-6 bg-secondary-fixed/10 border-secondary-fixed/30">
              <h3 className="font-bold text-primary mb-2">Your profile</h3>
              <p className="text-xs text-on-surface-variant">{profileHint}</p>
              <p className="text-xs text-text-secondary mt-2">Groups matching your entry and board appear when you search.</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for groups by name, entry, or city..."
              className="w-full bg-surface border border-outline-variant/30 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-1 focus:ring-primary transition-all shadow-[0_2px_12px_rgba(0,0,0,0.07)] outline-none"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-outline" size={32} />
            </div>
          ) : groups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto text-outline-variant mb-3" size={40} />
              <p className="font-bold text-primary">No groups found</p>
              <p className="text-sm text-text-secondary mt-1">Create the first study group for your entry!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const isMember = Boolean(group.is_member || group.my_role);
                const isPending = Boolean(group.pending_join_request);
                const isOwner = group.my_role === 'OWNER' || group.my_role === 'MODERATOR';
                const pendingCount = group.pending_requests_count ?? 0;

                return (
                  <Card key={group.id} className="p-5 card-hover border-outline-variant/20">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-low overflow-hidden flex-shrink-0 border border-outline-variant/30">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${group.slug}`}
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-primary truncate">{group.name}</h4>
                          {group.is_private ? (
                            <Lock size={14} className="text-outline flex-shrink-0" />
                          ) : (
                            <Globe size={14} className="text-outline flex-shrink-0" />
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-text-secondary line-clamp-2 mb-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {group.members_count} members
                          </span>
                          <span className="px-2 py-0.5 bg-surface-container text-primary rounded-full font-bold">
                            {group.category}
                          </span>
                        </div>

                        {isOwner && pendingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setManageGroup(group)}
                            className="w-full mb-2 font-bold py-2 rounded-lg text-xs bg-accent-50 text-accent-700 border border-accent-200 hover:bg-accent-100 transition-all flex items-center justify-center gap-1.5"
                          >
                            <UserCheck size={14} />
                            Review {pendingCount} join request{pendingCount !== 1 ? 's' : ''}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => !isMember && !isPending && handleJoin(group)}
                          disabled={isMember || isPending || joiningId === group.id}
                          className={cn(
                            'w-full font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5',
                            isMember
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                                : 'bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary border border-outline-variant/30'
                          )}
                        >
                          {joiningId === group.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : isPending ? (
                            <>
                              <Clock size={14} /> Request Pending
                            </>
                          ) : isMember ? (
                            <>
                              <Check size={14} /> Joined
                            </>
                          ) : (
                            getJoinLabel(group)
                          )}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setActionMsg('Group created. Selected connections were added as members.');
            loadGroups();
          }}
        />
      )}

      {manageGroup && (
        <ManageJoinRequestsModal
          group={manageGroup}
          onClose={() => setManageGroup(null)}
          onUpdated={() => {
            loadGroups();
          }}
        />
      )}
    </div>
  );
};

const CreateGroupModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('NDA');
  const [city, setCity] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState<ApiUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [friendSearch, setFriendSearch] = useState('');

  useEffect(() => {
    NetworkService.getFriends()
      .then((res) => setConnections(Array.isArray(res.data) ? res.data : []))
      .catch(() => setConnections([]))
      .finally(() => setLoadingFriends(false));
  }, []);

  const toggleMember = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredConnections = connections.filter((c) => {
    const q = friendSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.username.toLowerCase().includes(q) ||
      displayName(c).toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await GroupService.create({
        name: name.trim(),
        slug: slugify(name.trim()),
        description: description.trim(),
        category,
        city: city.trim(),
        is_private: isPrivate,
        member_ids: Array.from(selectedIds),
      });
      onCreated();
    } catch (e: any) {
      const data = e.response?.data;
      setError(data?.detail || data?.member_ids?.[0] || data?.name?.[0] || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-primary">Create Study Group</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg">
            <X size={20} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {CATEGORIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <label className="flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private group (others must request access to join)
          </label>

          <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-low/50">
            <p className="text-sm font-bold text-primary mb-1">Add members from connections</p>
            <p className="text-xs text-text-secondary mb-3">
              Select friends to add directly when the group is created.
            </p>
            {loadingFriends ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-outline" size={20} />
              </div>
            ) : connections.length === 0 ? (
              <p className="text-xs text-text-secondary">
                No connections yet. Add friends from the Connections page first.
              </p>
            ) : (
              <>
                <input
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Search connections..."
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs mb-2 outline-none focus:ring-2 focus:ring-accent-400"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredConnections.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(friend.id)}
                        onChange={() => toggleMember(friend.id)}
                      />
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                        alt=""
                        className="w-7 h-7 rounded-full"
                      />
                      <span className="text-sm text-primary truncate">{displayName(friend)}</span>
                    </label>
                  ))}
                </div>
                {selectedIds.size > 0 && (
                  <p className="text-xs text-accent-600 font-semibold mt-2">
                    {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="w-full mt-6 ssb-btn-primary py-3 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Group'}
        </button>
      </Card>
    </div>
  );
};

const ManageJoinRequestsModal = ({
  group,
  onClose,
  onUpdated,
}: {
  group: StudyGroup;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GroupService.getJoinRequests(group.id);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load join requests.');
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const respond = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
    setActingId(requestId);
    setError('');
    try {
      await GroupService.respondJoinRequest(group.id, requestId, status);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onUpdated();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Action failed.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg text-primary">Join Requests</h2>
            <p className="text-xs text-text-secondary mt-0.5">{group.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-outline" size={28} />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user.username}`}
                  alt=""
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary truncate">{displayName(req.user)}</p>
                  <p className="text-xs text-text-secondary">@{req.user.username}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    disabled={actingId === req.id}
                    onClick={() => respond(req.id, 'APPROVED')}
                    className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                    title="Approve"
                  >
                    {actingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    disabled={actingId === req.id}
                    onClick={() => respond(req.id, 'REJECTED')}
                    className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    title="Decline"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Groups;
