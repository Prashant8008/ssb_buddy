import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2, X } from 'lucide-react';
import { ProfileService } from '../services/api';
import ConnectActions, { ConnectionStatus } from '../components/social/ConnectActions';
import DiscoverMap from '../components/map/DiscoverMap';
import LocationPromptModal from '../components/location/LocationPromptModal';
import { wasLocationSkipped } from '../lib/userLocation';
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
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const loadMyLocation = useCallback(async () => {
    try {
      const res = await ProfileService.getMe();
      const { latitude, longitude } = res.data;
      if (latitude != null && longitude != null && latitude !== '' && longitude !== '') {
        setUserPosition({
          latitude: Number(latitude),
          longitude: Number(longitude),
        });
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }, []);

  useEffect(() => {
    (async () => {
      const hasCoords = await loadMyLocation();
      if (!hasCoords && !wasLocationSkipped()) {
        setShowLocationPrompt(true);
      }
    })();
  }, [loadMyLocation]);

  const handleLocationSaved = async () => {
    await loadMyLocation();
    setShowLocationPrompt(false);
  };

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
  const selectedProfile = visibleProfiles.find((p) => p.user.id === selectedUserId);

  return (
    <div className="h-[calc(100vh-4rem)] relative w-full flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Sidebar list - Styled to feel like premium glass sidebar */}
      <div className="w-full md:w-96 lg:w-[26rem] bg-white/95 backdrop-blur-md border-r border-outline-variant/30/50 flex flex-col z-10 max-h-[40vh] md:max-h-none shrink-0 shadow-lg relative">
        <div className="p-4 border-b border-outline-variant/30/60">
          <h2 className="text-lg font-display font-bold text-primary">Discover Aspirants</h2>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Locate and connect with candidates in your region.
          </p>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, board..."
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-accent-400 outline-none transition-all"
              />
            </div>
            <button type="button" className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30/40 rounded-lg text-on-surface-variant transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 pt-3 flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {ENTRY_FILTERS.map((tag) => {
            let activeClass = "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30";
            if (entryFilter === tag) {
              if (tag === 'NDA') activeClass = "bg-primary text-on-primary border border-primary-container";
              else if (tag === 'CDS') activeClass = "bg-tertiary-container text-tertiary-fixed border border-tertiary-fixed/30";
              else if (tag === 'AFCAT') activeClass = "bg-secondary text-on-secondary border border-secondary-container";
              else activeClass = "bg-primary text-on-primary border border-primary-container";
            }
            return (
              <button
                key={tag || 'all'}
                type="button"
                onClick={() => setEntryFilter(tag)}
                className={`flex-shrink-0 px-3 py-1 text-[9px] font-bold rounded-full uppercase tracking-wider transition-all ${activeClass}`}
              >
                {tag || 'All'}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-secondary-fixed" size={24} />
            </div>
          ) : visibleProfiles.length === 0 ? (
            <p className="text-center text-xs text-outline py-16 font-medium">
              No aspirants match your criteria.
            </p>
          ) : (
            visibleProfiles.map((p) => {
              const conn = connections[p.user.username] ?? null;
              const subtitle = [
                p.entry_type && `${p.entry_type} Aspirant`,
                p.city,
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
                    'p-3.5 rounded-xl border transition-all cursor-pointer bg-white text-left',
                    isSelected
                      ? 'border-secondary-fixed bg-secondary-fixed/10/20 shadow-sm'
                      : 'border-outline-variant/20 hover:border-secondary-fixed shadow-sm'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${p.user.username}`} onClick={(e) => e.stopPropagation()}>
                      <img
                        src={p.profile_picture || getAvatar(p.user.username)}
                        alt=""
                        className="w-10 h-10 rounded-full bg-surface-container-low object-cover border border-outline-variant/30"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${p.user.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-xs text-primary hover:underline"
                      >
                        {displayName(p.user)}
                      </Link>
                      <p className="text-[10px] text-outline font-semibold">@{p.user.username}</p>
                      {subtitle && <p className="text-[10px] text-text-secondary mt-1">{subtitle}</p>}
                      {p.bio && (
                        <p className="text-[10px] text-on-surface-variant mt-1.5 line-clamp-1 italic">"{p.bio}"</p>
                      )}
                      <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
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

      {/* Fullscreen Map container */}
      <div className="flex-1 min-h-[60vh] md:min-h-0 relative z-0 bg-surface-container h-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low z-10">
            <Loader2 className="animate-spin text-outline mr-2" size={20} />
            <p className="text-xs text-outline font-medium">Re-orienting map view...</p>
          </div>
        ) : (
          <DiscoverMap
            profiles={visibleProfiles}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
            userPosition={userPosition}
          />
        )}
        {!loading && visibleProfiles.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 z-10">
            <p className="rounded-lg bg-white/95 px-4 py-2 text-xs font-semibold text-text-secondary shadow-md border border-outline-variant/30">
              No aspirants found in active viewport.
            </p>
          </div>
        )}

        {/* Selected Candidate Overlay Details Card */}
        {selectedProfile && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-20 w-auto md:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-outline-variant/30 p-4 shadow-2xl flex flex-col gap-3 animate-fade-in pointer-events-auto">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <img
                  src={selectedProfile.profile_picture || getAvatar(selectedProfile.user.username)}
                  alt=""
                  className="w-11 h-11 rounded-full border-2 border-secondary-fixed shrink-0 object-cover"
                />
                <div>
                  <Link
                    to={`/profile/${selectedProfile.user.username}`}
                    className="font-bold text-xs text-primary hover:underline block"
                  >
                    {displayName(selectedProfile.user)}
                  </Link>
                  <p className="text-[9px] text-outline font-semibold">@{selectedProfile.user.username}</p>
                  <span className="inline-block mt-1 text-[8px] font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-full uppercase border border-accent-100 tracking-wider">
                    {selectedProfile.entry_type || 'NDA'} Aspirant
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-outline hover:text-on-surface-variant p-1 transition-colors"
                aria-label="Close detail card"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1 text-[11px] text-on-surface-variant border-t border-outline-variant/20 pt-2">
              <p>📍 <b>Location:</b> {selectedProfile.city}, {selectedProfile.state}</p>
              {selectedProfile.preferred_service && (
                <p>⚓ <b>Service Preferred:</b> {selectedProfile.preferred_service}</p>
              )}
              {selectedProfile.ssb_board && (
                <p>🛡️ <b>SSB Target Board:</b> {selectedProfile.ssb_board}</p>
              )}
              {selectedProfile.bio && (
                <p className="text-text-secondary italic mt-1 line-clamp-2">"{selectedProfile.bio}"</p>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
              <Link
                to={`/profile/${selectedProfile.user.username}`}
                className="flex-1 text-center bg-primary hover:bg-primary-container text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
              >
                View Profile
              </Link>
              <div className="flex-1">
                <ConnectActions
                  userId={selectedProfile.user.id}
                  username={selectedProfile.user.username}
                  connection={connections[selectedProfile.user.username] ?? null}
                  size="sm"
                  onConnectionChange={(status) => handleConnectionChange(selectedProfile.user.username, status)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <LocationPromptModal
        open={showLocationPrompt}
        title="Share location to discover people"
        description="Allow location access to appear on the map and find SSB aspirants near you. You can skip and set your city later in Profile."
        onClose={() => setShowLocationPrompt(false)}
        onSaved={handleLocationSaved}
      />
    </div>
  );
};

export default LocalityMap;
