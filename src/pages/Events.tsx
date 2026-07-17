import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Calendar, MapPin, Clock, Users, Filter, Plus, Shield, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { EventService } from '../services/api';
import { format, isTomorrow, isToday, parseISO } from 'date-fns';

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface ApiEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  host: ApiUser;
  starts_at: string;
  ends_at: string | null;
  city: string;
  state: string;
  online_url: string;
  rsvp_count: number;
}

interface ApiRsvp {
  id: number;
  event: ApiEvent;
  status: string;
}

const EVENT_TYPES = [
  { value: '', label: 'All' },
  { value: 'MOCK_INTERVIEW', label: 'Mock Interview' },
  { value: 'GD', label: 'Group Discussion' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'LECTURETTE', label: 'Lecturette' },
  { value: 'CURRENT_AFFAIRS', label: 'Current Affairs' },
];

const formatEventType = (t: string) =>
  EVENT_TYPES.find((e) => e.value === t)?.label || t.replace(/_/g, ' ');

const formatEventDate = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return { top: 'Today', bottom: format(d, 'd') };
  if (isTomorrow(d)) return { top: 'Tomorrow', bottom: format(d, 'd') };
  return { top: format(d, 'MMM'), bottom: format(d, 'd') };
};

const hostName = (host: ApiUser) =>
  host.full_name || `${host.first_name} ${host.last_name}`.trim() || host.username;

const eventLocation = (e: ApiEvent) => {
  if (e.online_url) return 'Online';
  const loc = [e.city, e.state].filter(Boolean).join(', ');
  return loc || 'TBA';
};

const Events = () => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [rsvps, setRsvps] = useState<ApiRsvp[]>([]);
  const [rsvpIds, setRsvpIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [rsvpingId, setRsvpingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, rsvpsRes] = await Promise.all([
        EventService.list({
          event_type: typeFilter || undefined,
          ordering: 'starts_at',
        }),
        EventService.myRsvps(),
      ]);
      const ev: ApiEvent[] = eventsRes.data.results ?? eventsRes.data;
      const myRsvps: ApiRsvp[] = rsvpsRes.data.results ?? rsvpsRes.data;
      setEvents(Array.isArray(ev) ? ev : []);
      setRsvps(Array.isArray(myRsvps) ? myRsvps : []);
      setRsvpIds(
        new Set(
          myRsvps.map((r) =>
            typeof r.event === 'object' && r.event ? r.event.id : (r.event as unknown as number)
          )
        )
      );
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRsvp = async (eventId: number) => {
    setRsvpingId(eventId);
    try {
      await EventService.rsvp(eventId);
      setRsvpIds((prev) => new Set([...prev, eventId]));
      await load();
    } catch (e) {
      console.error('RSVP failed:', e);
    } finally {
      setRsvpingId(null);
    }
  };

  const featured = events[0];
  const upcoming = events.slice(featured ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="ssb-page-title">Upcoming Events</h1>
          <p className="ssb-page-sub">Sharpen your OLQs through community drills and expert webinars.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="ssb-btn-gold px-6 py-3 flex items-center gap-2 self-start md:self-center"
        >
          <Plus size={18} /> Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {featured && !loading && (
            <div className="relative rounded-3xl overflow-hidden bg-primary text-white p-8 md:p-12 mb-8">
              <div className="relative z-10 max-w-lg">
                <span className="bg-secondary-fixed text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                  {formatEventType(featured.event_type)}
                </span>
                <h2 className="text-3xl font-display font-bold mb-4">{featured.title}</h2>
                {featured.description && (
                  <p className="text-outline-variant mb-8 leading-relaxed line-clamp-3">{featured.description}</p>
                )}
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={18} className="text-secondary-fixed" />
                    {format(parseISO(featured.starts_at), 'd MMM yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={18} className="text-secondary-fixed" />
                    {format(parseISO(featured.starts_at), 'hh:mm a')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRsvp(featured.id)}
                  disabled={rsvpIds.has(featured.id) || rsvpingId === featured.id}
                  className="bg-white text-primary px-8 py-3 rounded-xl font-bold hover:bg-surface-container-low transition-all disabled:opacity-60"
                >
                  {rsvpIds.has(featured.id) ? 'RSVP Confirmed' : 'RSVP Now'}
                </button>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                <Shield size={300} className="text-white translate-x-1/4 translate-y-1/4" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary text-lg">Upcoming Events</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary"
              >
                <Filter size={16} /> Filter
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-outline-variant/30 rounded-xl shadow-lg p-2 z-10 min-w-[160px]">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setTypeFilter(t.value); setShowFilter(false); }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs font-medium rounded-lg',
                        typeFilter === t.value ? 'bg-primary text-white' : 'hover:bg-surface-container-low'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-outline" size={32} />
            </div>
          ) : upcoming.length === 0 && !featured ? (
            <Card className="p-12 text-center">
              <Calendar className="mx-auto text-outline-variant mb-3" size={40} />
              <p className="font-bold text-primary">No events scheduled</p>
              <p className="text-sm text-text-secondary mt-1">Be the first to host a mock session!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcoming.map((event) => {
                const dateParts = formatEventDate(event.starts_at);
                return (
                  <Card key={event.id} className="p-5 card-hover border-outline-variant/20">
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 bg-primary rounded-xl text-on-primary">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{dateParts.top}</span>
                        <span className="text-2xl font-bold leading-none">{dateParts.bottom}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
                          {formatEventType(event.event_type)}
                        </span>
                        <h4 className="font-bold text-primary text-lg">{event.title}</h4>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-secondary font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {format(parseISO(event.starts_at), 'hh:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {eventLocation(event)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {event.rsvp_count} going
                          </span>
                        </div>
                        <p className="text-xs text-outline mt-1">Host: {hostName(event.host)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRsvp(event.id)}
                        disabled={rsvpIds.has(event.id) || rsvpingId === event.id}
                        className={cn(
                          'px-6 py-2.5 rounded-full font-bold transition-all text-xs uppercase tracking-wider',
                          rsvpIds.has(event.id)
                            ? 'bg-tertiary-fixed/30 text-tertiary-container border border-tertiary-fixed/40'
                            : 'ssb-btn-primary'
                        )}
                      >
                        {rsvpingId === event.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : rsvpIds.has(event.id) ? (
                          'Going'
                        ) : (
                          'RSVP'
                        )}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-primary mb-4">Your Schedule</h3>
            {rsvps.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={40} className="text-surface-container mx-auto mb-4" />
                <p className="text-sm text-text-secondary">No events scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rsvps.map((r) => {
                  const ev = r.event;
                  if (!ev?.title) return null;
                  return (
                    <div key={r.id} className="p-3 bg-surface-container-low rounded-xl">
                      <p className="text-sm font-bold text-primary">{ev.title}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {format(parseISO(ev.starts_at), 'd MMM · hh:mm a')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6 bg-secondary-fixed/10 border-secondary-fixed/20">
            <h3 className="font-bold text-primary mb-2">Host a Session</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Recommended candidates and mentors can host mock sessions for the community.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full ssb-btn-gold py-3"
            >
              Create Event
            </button>
          </Card>
        </div>
      </div>

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
    </div>
  );
};

const CreateEventModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('MOCK_INTERVIEW');
  const [startsAt, setStartsAt] = useState('');
  const [city, setCity] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!title.trim() || !startsAt) {
      setError('Title and start date/time are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await EventService.create({
        title: title.trim(),
        description: description.trim(),
        event_type: eventType,
        starts_at: new Date(startsAt).toISOString(),
        city: city.trim(),
        online_url: onlineUrl.trim(),
      });
      onCreated();
    } catch (e: any) {
      const data = e.response?.data;
      setError(data?.detail || data?.title?.[0] || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-primary">Host an Event</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg">
            <X size={20} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
          />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {EVENT_TYPES.filter((t) => t.value).map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <input
            value={onlineUrl}
            onChange={(e) => setOnlineUrl(e.target.value)}
            placeholder="Online meeting URL (optional)"
            className="w-full bg-surface-container-low rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="w-full mt-6 bg-secondary-fixed text-primary py-3 rounded-xl font-bold hover:bg-secondary-container disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Publish Event'}
        </button>
      </Card>
    </div>
  );
};

export default Events;
