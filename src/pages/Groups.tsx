import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Users, Search, Plus, Globe, Lock, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { GroupService, ProfileService } from '../services/api';

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
}

const CATEGORIES = ['', 'NDA', 'CDS', 'AFCAT', 'SSB', 'ARMY', 'NAVY', 'AIR_FORCE'];

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
  '-' + Date.now().toString(36);

const Groups = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [profileHint, setProfileHint] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, membersRes, profileRes] = await Promise.all([
        GroupService.list({
          search: search.trim() || undefined,
          category: category || undefined,
        }),
        GroupService.myMemberships(),
        ProfileService.getMe().catch(() => null),
      ]);
      const data: StudyGroup[] = groupsRes.data.results ?? groupsRes.data;
      setGroups(Array.isArray(data) ? data : []);
      const members = membersRes.data.results ?? membersRes.data;
      setJoinedIds(new Set((Array.isArray(members) ? members : []).map((m: { group: number }) => m.group)));
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

  const handleJoin = async (groupId: number) => {
    setJoiningId(groupId);
    try {
      await GroupService.join(groupId);
      setJoinedIds((prev) => new Set([...prev, groupId]));
      await loadGroups();
    } catch (e) {
      console.error('Join failed:', e);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-900">Community Groups</h1>
          <p className="text-navy-500">Connect with aspirants preparing for the same entry.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="bg-navy-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-800 transition-all flex items-center gap-2 shadow-lg shadow-navy-900/10 self-start md:self-center"
        >
          <Plus size={20} /> Create New Group
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-navy-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat || 'all'}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    category === cat
                      ? 'bg-navy-900 text-white'
                      : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                  )}
                >
                  {cat || 'All Groups'}
                </button>
              ))}
            </div>
          </Card>

          {profileHint && (
            <Card className="p-6 bg-gold-50 border-gold-100">
              <h3 className="font-bold text-navy-900 mb-2">Your profile</h3>
              <p className="text-xs text-navy-600">{profileHint}</p>
              <p className="text-xs text-navy-500 mt-2">Groups matching your entry and board appear when you search.</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for groups by name, entry, or city..."
              className="w-full bg-white border border-navy-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-gold-500 transition-all shadow-sm outline-none"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-navy-400" size={32} />
            </div>
          ) : groups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto text-navy-300 mb-3" size={40} />
              <p className="font-bold text-navy-700">No groups found</p>
              <p className="text-sm text-navy-500 mt-1">Create the first study group for your entry!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Card key={group.id} className="p-5 hover:shadow-md transition-all border-navy-100">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-navy-50 overflow-hidden flex-shrink-0 border border-navy-100">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${group.slug}`}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-navy-900 truncate">{group.name}</h4>
                        {group.is_private ? (
                          <Lock size={14} className="text-navy-400 flex-shrink-0" />
                        ) : (
                          <Globe size={14} className="text-navy-400 flex-shrink-0" />
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-navy-500 line-clamp-2 mb-2">{group.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-navy-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {group.members_count} members
                        </span>
                        <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded-full font-bold">
                          {group.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJoin(group.id)}
                        disabled={joinedIds.has(group.id) || joiningId === group.id}
                        className={cn(
                          'w-full font-bold py-2 rounded-lg text-xs transition-all',
                          joinedIds.has(group.id)
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-navy-50 hover:bg-navy-900 hover:text-white text-navy-900'
                        )}
                      >
                        {joiningId === group.id ? (
                          <Loader2 className="animate-spin mx-auto" size={14} />
                        ) : joinedIds.has(group.id) ? (
                          'Joined'
                        ) : (
                          'Join Group'
                        )}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadGroups(); }} />
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
      });
      onCreated();
    } catch (e: any) {
      const data = e.response?.data;
      setError(data?.detail || data?.name?.[0] || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-navy-900">Create Study Group</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-navy-50 rounded-lg">
            <X size={20} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-navy-50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-gold-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full bg-navy-50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-gold-500 resize-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-navy-50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-gold-500"
          >
            {CATEGORIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="w-full bg-navy-50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-gold-500"
          />
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private group
          </label>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="w-full mt-6 bg-navy-900 text-white py-3 rounded-xl font-bold hover:bg-navy-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Group'}
        </button>
      </Card>
    </div>
  );
};

export default Groups;
