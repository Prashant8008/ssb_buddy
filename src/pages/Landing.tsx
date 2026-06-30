import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthPanel, { AuthTab } from '../components/auth/AuthPanel';
import HeroAdventureBackground from '../components/landing/HeroAdventureBackground';
import {
  Shield,
  Users,
  MessageCircle,
  Calendar,
  BookOpen,
  ChevronRight,
  MapPin,
  Clock,
  Send,
  Share2,
  Globe,
  Video,
  Menu,
  X,
  Flame,
  Radio,
  GraduationCap,
  Target,
  Award,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

const glass =
  'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl';

const navLinks = [
  { label: 'Home', href: '#top' },
  { label: 'Community', href: '#community' },
  { label: 'Events', href: '#events' },
  { label: 'Resources', href: '#features' },
  { label: 'Mentors', href: '#about' },
  { label: 'Success Stories', href: '#stories' },
];

const liveStats = [
  { icon: Users, value: '20K+', label: 'Aspirants' },
  { icon: GraduationCap, value: '500+', label: 'Mentors' },
  { icon: MessageCircle, value: '2.5K+', label: 'Discussions' },
  { icon: Calendar, value: '100+', label: 'Events' },
];

const hubEvents = [
  { day: '15', month: 'JUN', title: 'SSB Preparation Webinar', time: '6:00 PM · Online' },
  { day: '18', month: 'JUN', title: 'Group Discussion Practice', time: '5:30 PM · Bangalore' },
  { day: '22', month: 'JUN', title: 'Mock Interview Session', time: '4:00 PM · Online' },
];

const feedPosts = [
  {
    seed: 'arjun',
    name: 'Arjun_S',
    time: '2h ago',
    body: 'Just cleared my screening test! Happy to share my PPDT approach with anyone preparing for NDA.',
    hot: true,
    replies: 24,
  },
  {
    seed: 'priya',
    name: 'Priya_M',
    time: '4h ago',
    body: 'Looking for a GD practice group in Pune this weekend. Anyone interested?',
    hot: false,
    replies: 12,
  },
  {
    seed: 'rahul',
    name: 'Rahul_V',
    time: '6h ago',
    body: 'Sharing my TAT practice notes — 30 prompts with sample stories. Link in comments.',
    hot: true,
    replies: 38,
  },
];

const popularGroups = [
  { name: 'NDA Aspirants 2025', members: '4.2K', icon: Target, color: 'text-olive-600 bg-olive-900/40' },
  { name: 'CDS Preparation Hub', members: '3.1K', icon: Shield, color: 'text-signal-500 bg-signal-500/10' },
  { name: 'AFCAT Study Circle', members: '2.8K', icon: Award, color: 'text-sky-400 bg-sky-400/10' },
  { name: 'SSB Tips & Experiences', members: '5.6K', icon: BookOpen, color: 'text-white/70 bg-white/5' },
];

const successStories = [
  { seed: 'vikram', name: 'Vikram S.', quote: 'Found my study tribe here. Cleared SSB on my second attempt.', entry: 'NDA 2024' },
  { seed: 'meera', name: 'Meera K.', quote: 'The mock GDs and mentor sessions were game-changers.', entry: 'CDS 2024' },
  { seed: 'dev', name: 'Dev P.', quote: 'Real aspirants, real support. No toxic competition.', entry: 'AFCAT 2024' },
  { seed: 'sana', name: 'Sana R.', quote: 'Events kept me disciplined through 8 months of prep.', entry: 'SSB Recommended' },
];

const LOGO_SRC = '/ssb-connect-logo.png';

const logoImageClass =
  'rounded-full object-cover ring-1 ring-white/10 shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02]';

const Logo = ({ className, imageClassName }: { className?: string; imageClassName?: string }) => (
  <Link to="/" className={cn('inline-flex items-center group', className)}>
    <img
      src={LOGO_SRC}
      alt="SSB Connect — Army, Navy, Air Force"
      className={cn('h-11 w-11', logoImageClass, imageClassName)}
    />
  </Link>
);

const Landing = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [feedTab, setFeedTab] = useState<'trending' | 'latest' | 'following'>('trending');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openAuth = (tab: AuthTab) => {
    setAuthTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top" className="min-h-screen bg-midnight-950 text-white scroll-smooth selection:bg-signal-500/30">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col">
        <HeroAdventureBackground />

        <header
          className={cn(
            'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
            scrolled ? 'bg-midnight-950/90 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Logo />

            <nav className="hidden xl:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="px-5 py-2 text-sm font-semibold text-white/80 border border-white/20 rounded-full hover:bg-white/5 transition-all"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="px-5 py-2.5 text-sm font-bold text-midnight-950 bg-signal-500 hover:bg-signal-400 rounded-full transition-all shadow-lg shadow-signal-500/25"
              >
                Sign Up
              </button>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-white/80"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {mobileNavOpen && (
            <div className="md:hidden border-t border-white/10 bg-midnight-950/95 backdrop-blur-xl px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileNavOpen(false)} className="block text-sm text-white/70 py-2">
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { openAuth('login'); setMobileNavOpen(false); }} className="flex-1 py-2.5 text-sm border border-white/20 rounded-full">
                  Login
                </button>
                <button type="button" onClick={() => { openAuth('signup'); setMobileNavOpen(false); }} className="flex-1 py-2.5 text-sm font-bold bg-signal-500 text-midnight-950 rounded-full">
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 lg:pt-28 pb-12 flex flex-col justify-center">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.img
                src={LOGO_SRC}
                alt="SSB Connect logo"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover ring-2 ring-white/10 shadow-2xl shadow-black/40 mb-6"
              />
              <p className="text-signal-500/90 text-xs font-bold uppercase tracking-[0.25em] mb-5">
                India&apos;s Armed Forces Community
              </p>
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] tracking-tight">
                ONE GOAL. ONE COMMUNITY.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal-400 to-signal-500">
                  ENDLESS POSSIBILITIES.
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-white/55 max-w-lg leading-relaxed">
                Connect with aspirants, mentors, and seniors. Practice together, join events,
                and prepare for your SSB journey — as one community.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-olive-900 hover:bg-olive-800 text-white font-bold rounded-full border border-olive-700/50 transition-all"
                >
                  Join the Community
                  <ChevronRight size={18} />
                </button>
                <a
                  href="#events"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white/80 font-semibold rounded-full border border-white/20 hover:bg-white/5 transition-all"
                >
                  Explore Events
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <AuthPanel tab={authTab} onTabChange={setAuthTab} variant="hero-dark" />
            </motion.div>
          </div>
        </div>

        {/* Live stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-10"
        >
          <div className={cn(glass, 'grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]')}>
            {liveStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4 lg:py-5">
                <div className="w-9 h-9 rounded-full border border-signal-500/30 flex items-center justify-center text-signal-500">
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-display font-bold text-lg leading-none">{value}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 uppercase tracking-wider">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Community Hub ── */}
      <section id="community" className="relative py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="mb-10">
            <p className="text-signal-500/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">Live Community</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl">See What&apos;s Happening Now</h2>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-5">
            {/* Events column */}
            <motion.div {...fadeUp} id="events" className={cn(glass, 'lg:col-span-3 p-5')}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Calendar size={15} className="text-signal-500" />
                  Upcoming Events
                </h3>
              </div>
              <div className="space-y-3">
                {hubEvents.map((ev) => (
                  <div
                    key={ev.title}
                    className="group p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-signal-500/20 hover:bg-white/[0.05] transition-all cursor-pointer"
                  >
                    <div className="flex gap-3">
                      <div className="text-center shrink-0 w-11 py-1 rounded-lg bg-olive-900/60 border border-olive-700/30">
                        <p className="text-[9px] font-bold text-white/50">{ev.month}</p>
                        <p className="text-lg font-bold leading-none text-signal-500">{ev.day}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug truncate">{ev.title}</p>
                        <p className="text-[11px] text-white/40 mt-1">{ev.time}</p>
                        <button type="button" className="mt-2 text-[11px] font-bold text-signal-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Register →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Feed column */}
            <motion.div {...fadeUp} className={cn(glass, 'lg:col-span-5 p-5')}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <MessageCircle size={15} className="text-signal-500" />
                  Active Community
                </h3>
                <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04]">
                  {(['trending', 'latest', 'following'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFeedTab(t)}
                      className={cn(
                        'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all capitalize',
                        feedTab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {feedPosts.map((post) => (
                  <div
                    key={post.name}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.seed}`}
                        alt=""
                        className="w-9 h-9 rounded-full bg-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">{post.name}</span>
                          <span className="text-[10px] text-white/35">{post.time}</span>
                          {post.hot && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-400">
                              <Flame size={11} /> Hot
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-1 leading-relaxed">{post.body}</p>
                        <p className="text-[11px] text-white/35 mt-2">{post.replies} replies</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Groups + Live */}
            <div className="lg:col-span-4 space-y-5">
              <motion.div {...fadeUp} className={cn(glass, 'p-5')}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                  <Users size={15} className="text-signal-500" />
                  Popular Groups
                </h3>
                <div className="space-y-2">
                  {popularGroups.map((g) => (
                    <div
                      key={g.name}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', g.color)}>
                        <g.icon size={16} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-signal-400 transition-colors">{g.name}</p>
                        <p className="text-[11px] text-white/35">{g.members} members</p>
                      </div>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                {...fadeUp}
                className={cn(glass, 'p-5 border-signal-500/15')}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <h3 className="font-bold text-sm">Live Now</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: '356 Aspirants Online', icon: Radio },
                    { label: '12 New Discussions Today', icon: MessageCircle },
                    { label: '5 Events This Week', icon: Calendar },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 text-sm text-white/60">
                      <Icon size={14} className="text-signal-500/70 shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section id="features" className="py-14 border-y border-white/[0.05] bg-midnight-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Connect', desc: 'Find mentors & peers' },
              { icon: MessageCircle, title: 'Discuss', desc: 'Share real experiences' },
              { icon: Calendar, title: 'Events', desc: 'GDs, mocks & meetups' },
              { icon: BookOpen, title: 'Learn', desc: 'Resources & guidance' },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                {...fadeUp}
                whileHover={{ y: -2 }}
                className="text-center p-4 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-10 h-10 mx-auto rounded-full border border-signal-500/25 flex items-center justify-center text-signal-500 mb-3">
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-xs text-white/40 mt-1">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Success Stories ── */}
      <section id="stories" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-signal-500/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">Success Stories</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl">Aspirants Who Made It</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {successStories.map((s) => (
              <motion.div
                key={s.name}
                {...fadeUp}
                whileHover={{ y: -3 }}
                className={cn(glass, 'p-6 text-center')}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.seed}`}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto border-2 border-signal-500/30 bg-white/5"
                />
                <p className="mt-4 text-sm text-white/60 italic leading-relaxed">&ldquo;{s.quote}&rdquo;</p>
                <p className="mt-3 text-sm font-bold">{s.name}</p>
                <p className="text-[11px] text-signal-500/80 mt-0.5">{s.entry}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Report for Duty CTA ── */}
      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
              Your Journey.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal-400 to-signal-500">
                Our Mission.
              </span>
            </h2>
            <p className="mt-4 text-white/50 max-w-md mx-auto">
              Join thousands of defence aspirants preparing smarter, together.
            </p>
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="mt-8 inline-flex items-center gap-2 px-10 py-4 bg-signal-500 hover:bg-signal-400 text-midnight-950 font-bold text-lg rounded-full transition-all shadow-xl shadow-signal-500/25 hover:shadow-signal-500/40 hover:-translate-y-0.5"
            >
              Report for Duty
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-midnight-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <Logo imageClassName="h-14 w-14" />
              <p className="mt-4 text-sm text-white/40 leading-relaxed">
                India&apos;s community platform for SSB aspirants — connect, prepare, and grow together.
              </p>
              <div className="flex gap-3 mt-5">
                {[Share2, Video, Globe].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-signal-500 hover:border-signal-500/30 transition-all"
                    aria-label="Social"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/45">
                {navLinks.slice(0, 5).map((l) => (
                  <li key={l.label}><a href={l.href} className="hover:text-white transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/45">
                {['Help Center', 'Guidelines', 'Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Stay Connected</h4>
              <form
                className="flex rounded-full overflow-hidden bg-white/[0.05] border border-white/10"
                onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white placeholder:text-white/30 outline-none min-w-0"
                />
                <button type="submit" className="px-4 text-signal-500 hover:text-signal-400 transition-colors" aria-label="Subscribe">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

          <p className="mt-12 pt-8 border-t border-white/[0.06] text-center text-xs text-white/30">
            © {new Date().getFullYear()} SSB Connect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
