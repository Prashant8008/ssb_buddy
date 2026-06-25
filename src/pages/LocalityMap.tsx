import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2 } from 'lucide-react';
import { ProfileService } from '../services/api';
import ConnectActions, { ConnectionStatus } from '../components/social/ConnectActions';
import DiscoverMap from '../components/map/DiscoverMap';
import { cn } from '../lib/utils';

interface DiscoverProfile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  city: string;
  state: string;
  entry_type: string;
  preferred_service: string;
  ssb_board: string;
  bio: string;
  profile_picture: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

const ENTRY_FILTERS = ['', 'NDA', 'CDS', 'AFCAT', 'INET', 'AGNIVEER'];

const getAvatar = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

const displayName = (user: DiscoverProfile['user']) =>
  user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;

const LocalityMap = () => {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({});
  const [search, setSearch] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProfileService.discover({
        search: search.trim() || undefined,
        entry_type: entryFilter || undefined,
      });
      let data: DiscoverProfile[] = res.data.results ?? res.data;
      if (!Array.isArray(data)) data = [];

      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const myId = payload.user_id;
          if (myId) data = data.filter((p) => p.user.id !== myId);
        }
      } catch { /* ignore */ }

      setProfiles(data);

      const statusEntries = await Promise.all(
        data.map(async (p) => {
          try {
            const statusRes = await ProfileService.getConnectionStatus(p.user.username);
            return [p.user.username, statusRes.data] as const;
          } catch {
            return [p.user.username, null] as const;
          }
        })
      );
      setConnections(Object.fromEntries(statusEntries.filter(([, s]) => s && !s.is_self)));
    } catch (e) {
      console.error('Failed to load aspirants:', e);
    } finally {
      setLoading(false);
    }
  }, [search, entryFilter]);

  useEffect(() => {
    const timer = setTimeout(loadProfiles, 300);
    return () => clearTimeout(timer);
  }, [loadProfiles]);

  const handleConnectionChange = (username: string, status: ConnectionStatus) => {
    setConnections((prev) => ({ ...prev, [username]: status }));
  };

  const visibleProfiles = profiles.filter((p) => !connections[p.user.username]?.is_self);

  return (
    <div className="pt-16 h-[calc(100vh-0px)] flex flex-col md:flex-row">
      {/* Sidebar list */}
      <div className="w-full md:w-96 lg:w-[28rem] bg-white border-r border-navy-100 flex flex-col z-10 max-h-[45vh] md:max-h-none shrink-0">
        <div className="p-4 border-b border-navy-100">
          <h2 className="text-xl font-display font-bold text-navy-900">Discover Aspirants</h2>
          <p className="text-xs text-navy-500 mt-1">
            Tap a card or map marker to explore nearby candidates
          </p>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, board..."
                className="w-full bg-navy-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>
            <button type="button" className="p-2 bg-navy-50 rounded-lg text-navy-600">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-2">
          {ENTRY_FILTERS.map((tag) => (
            <button
              key={tag || 'all'}
              type="button"
              onClick={() => setEntryFilter(tag)}
              className={`flex-shrink-0 px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                entryFilter === tag
                  ? 'bg-navy-900 text-white'
                  : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
              }`}
            >
              {tag || 'All'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-navy-400" size={28} />
            </div>
          ) : visibleProfiles.length === 0 ? (
            <p className="text-center text-sm text-navy-500 py-16">
              No aspirants found. Try a different search or filter.
            </p>
          ) : (
            visibleProfiles.map((p) => {
              const conn = connections[p.user.username] ?? null;
              const subtitle = [
                p.entry_type && `${p.entry_type} Aspirant`,
                p.city,
                p.ssb_board,
              ].filter(Boolean).join(' · ');
              const isSelected = selectedUserId === p.user.id;

              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedUserId(p.user.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedUserId(p.user.id)}
                  className={cn(
                    'p-4 rounded-xl border transition-all cursor-pointer',
                    isSelected
                      ? 'border-gold-500 bg-gold-50/50 shadow-sm'
                      : 'border-navy-50 hover:border-gold-400'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${p.user.username}`} onClick={(e) => e.stopPropagation()}>
                      <img
                        src={p.profile_picture || getAvatar(p.user.username)}
                        alt=""
                        className="w-12 h-12 rounded-full bg-navy-100"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${p.user.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-sm text-navy-900 hover:underline"
                      >
                        {displayName(p.user)}
                      </Link>
                      <p className="text-xs text-navy-500">@{p.user.username}</p>
                      {subtitle && <p className="text-xs text-navy-500 mt-1">{subtitle}</p>}
                      {p.bio && (
                        <p className="text-xs text-navy-600 mt-2 line-clamp-2">{p.bio}</p>
                      )}
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <ConnectActions
                          userId={p.user.id}
                          username={p.user.username}
                          connection={conn}
                          size="sm"
                          onConnectionChange={(status) => handleConnectionChange(p.user.username, status)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leaflet map — OpenStreetMap tiles, no API key needed */}
      <div className="flex-1 min-h-[55vh] md:min-h-0 relative bg-navy-100">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-50">
            <p className="text-sm text-navy-400">Loading map...</p>
          </div>
        ) : (
          <DiscoverMap
            profiles={visibleProfiles}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
        )}
        {!loading && visibleProfiles.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <p className="rounded-lg bg-white/90 px-4 py-2 text-sm text-navy-500 shadow">
              No aspirants found — map shows India by default
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalityMap;
