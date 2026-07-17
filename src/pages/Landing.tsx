import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthPanel, { AuthTab } from '../components/auth/AuthPanel';
import {
  Shield,
  Star,
  Brain,
  Bot,
  Map,
  Heart,
  MessageSquare,
  Download,
  FileText,
  CheckCircle,
  ArrowRight,
  Globe,
  Share2,
  Mail,
  Users,
  Calendar,
  MessageCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';

const glass = 'bg-[#000317]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl';

const Landing = () => {
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openAuth = (tab: AuthTab) => {
    setAuthTab(tab);
    const authElement = document.getElementById('auth-section');
    if (authElement) {
      authElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-[#191c1f] scroll-smooth selection:bg-[#ffe08f] selection:text-[#241a00] font-sans">
      {/* Navigation Shell */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#000317]/95 shadow-lg py-3' : 'bg-[#000317]/90 py-4'
        } border-b border-white/[0.06] backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Shield className="text-[#ffe08f] w-8 h-8 fill-current" />
            <h1 className="text-xl font-bold text-[#ffe08f]">SSB Connect</h1>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-[#ffe08f] border-b-2 border-[#ffe08f] pb-1 text-xs font-semibold tracking-wider uppercase" href="#top">Home</a>
            <a className="text-[#7984ad] hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase" href="#features">Hub</a>
            <a className="text-[#7984ad] hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase" href="#feed">Feed</a>
            <a className="text-[#7984ad] hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase" href="#stories">Stories</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => openAuth('signup')}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#ffe08f] hover:bg-[#fed977] text-[#241a00] rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-gold-500/10"
            >
              Enlist Now
            </button>
            <button
              onClick={() => openAuth('login')}
              className="text-white hover:text-[#ffe08f] transition-colors text-xs font-semibold tracking-wider uppercase"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="hero-gradient min-h-[90vh] pt-24 pb-16 flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Background Animation Placement */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1f36 0%, transparent 70%)' }}></div>
        </div>

        <div className="max-w-7xl mx-auto w-full z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left text-white max-w-2xl mx-auto lg:mx-0">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0f1c3f] border border-[#7984ad]/20 text-[#ffe08f] text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
              <Star className="w-3.5 h-3.5 fill-current" />
              India's #1 Community for Future Officers
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-glow tracking-tight leading-tight">
              Your Journey to the <br /> <span className="text-[#ffe08f]">Stars</span> Begins Here.
            </h2>
            <p className="text-sm sm:text-base text-[#7984ad] mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Connect with thousands of aspirants, train with AI-powered SSB feedback, and track your Officer-Like Qualities (OLQs) in real-time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => openAuth('signup')}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#ffe08f] hover:bg-[#fed977] text-[#241a00] font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gold-500/20"
              >
                Join Community
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-[#7984ad] hover:border-white text-white font-bold rounded-full transition-all text-center"
              >
                Start Practice Hub
              </a>
            </div>

            {/* Stats Bar */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 glass-dark rounded-2xl border border-white/[0.06] text-center">
              <div>
                <div className="text-xl font-bold text-white">20K+</div>
                <div className="text-[9px] text-[#7984ad] uppercase tracking-widest font-semibold mt-1">Aspirants</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">1.2M</div>
                <div className="text-[9px] text-[#7984ad] uppercase tracking-widest font-semibold mt-1">Questions Solved</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">500+</div>
                <div className="text-[9px] text-[#7984ad] uppercase tracking-widest font-semibold mt-1">Mock Interviews</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">98%</div>
                <div className="text-[9px] text-[#7984ad] uppercase tracking-widest font-semibold mt-1">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Authentication Panel */}
          <div id="auth-section" className="flex justify-center lg:justify-end">
            <AuthPanel tab={authTab} onTabChange={setAuthTab} variant="hero-dark" />
          </div>
        </div>
      </section>

      {/* Features Bento Strip */}
      <section id="features" className="py-20 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-[#000317] tracking-tight">Built for Strategic Mastery</h3>
            <p className="text-sm text-[#6B7280] mt-2">Precision-engineered tools to help you crack the SSB interview.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: SSB Practice Hub */}
            <div className="p-6 bg-[#f2f3f7] rounded-2xl border border-[#c6c6cf]/20 hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
              <div className="w-12 h-12 bg-[#000317] flex items-center justify-center rounded-xl mb-6">
                <Brain className="text-white w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#000317] mb-2">Practice Hub</h4>
              <p className="text-xs text-[#45464e] leading-relaxed flex-grow">
                Complete TAT, WAT, and SRT modules with real-time timers and officer-vetted sample responses.
              </p>
              <a className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#000317] group-hover:gap-2.5 transition-all" href="#auth-section">
                Enter Hub <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2: AI Mentor */}
            <div className="p-6 bg-[#000317] text-white rounded-2xl hover:shadow-lg transition-all duration-300 flex flex-col h-full relative overflow-hidden">
              <div className="w-12 h-12 bg-[#ffe08f] flex items-center justify-center rounded-xl mb-6">
                <Bot className="text-[#241a00] w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#ffe08f] mb-2">AI Personal Mentor</h4>
              <p className="text-xs text-[#7984ad] leading-relaxed flex-grow">
                Our proprietary AI analyzes your PIQ form and simulates personalized interview questions tailored to your profile.
              </p>
              <button
                onClick={() => openAuth('signup')}
                className="mt-6 px-4 py-2 bg-[#ffe08f] hover:bg-[#fed977] text-[#241a00] rounded-lg font-bold text-xs w-fit"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Feature 3: Locality Map */}
            <div className="p-6 bg-[#f2f3f7] rounded-2xl border border-[#c6c6cf]/20 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 bg-green-500/10 flex items-center justify-center rounded-xl mb-6 text-green-700">
                <Map className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#000317] mb-2">Aspirant Network</h4>
              <p className="text-xs text-[#45464e] leading-relaxed flex-grow">
                Find and connect with fellow aspirants in your city for ground practice and PPDT sessions.
              </p>
              <div className="mt-6 rounded-lg overflow-hidden h-28 bg-[#edeef2] border border-[#c6c6cf] flex items-center justify-center relative bg-cover bg-center grayscale" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA8pDQkp6QGl_K_yn0TRWjju5abnBEiM5ySwpLjeu1M7Zg5txldPfUbcb7NyF1xgowd9m_Fj1CDy3ngu90ZizOu2_r84togoxbBbGpA6rlo4flVWwji8oE2Z01bKS42OX65qbteZKmTKLXr4uY_chbp1cUrsXGblAaL7FsYRsICJKoJtHbr2rq9Pc56mwXjTBbCKFidpXkmoiXj0e-t752FN3wkndF0vjFj7dTcOgTUB6dXkeTRBlTX5dnv8NvI_98WKTFs3Ug32oz_')" }}>
                <span className="absolute bg-[#000317]/70 text-[#ffe08f] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Map Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed Preview */}
      <section id="feed" className="py-20 bg-[#000317] text-white relative px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Pulse of the Regiment</h3>
              <p className="text-[#7984ad] text-xs sm:text-sm mt-2 leading-relaxed">
                Real-time updates from aspirants across the country. From PPDT experiences to daily motivation.
              </p>
            </div>
            <button
              onClick={() => openAuth('login')}
              className="px-6 py-2.5 bg-[#0f1c3f] border border-[#7984ad]/30 text-white rounded-full hover:bg-[#0f1c3f]/50 transition-all font-bold text-xs uppercase tracking-wider"
            >
              View Global Feed
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Post 1 */}
            <div className="glass-dark p-6 rounded-2xl border border-white/[0.05] hover:border-[#ffe08f]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-cover bg-center border border-[#ffe08f]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDp_iCeR5MmKLSP4eXw7Du0eoBIyoLbEwYHdMcHb5cr-UOoskn-YtFCEa91ollsjjafrTNg9WGNywd1RsWtvI6JEMknHyOC5kwYBcul9B5CM392zrXGBUz0a2L_se67XVcc_gRY-wjCXFane9LiEagRcHGdyJBF_xleMHb6TfhkV7PBb2e5wkM8cjxiJnpLqvqnUmdm2kRbASHPROGcvwsjMpEPolC8gnNDtmVQMFR91HvcBxEmCgdvu1aXrXyoh2oU57Z7aVtA3S9B')" }}></div>
                <div>
                  <p className="font-bold text-xs text-white">Vikram S. <span className="ml-2 px-1.5 py-0.5 bg-[#ffe08f]/20 text-[#ffe08f] text-[8px] rounded uppercase font-semibold">Recommended</span></p>
                  <p className="text-[9px] text-[#7984ad] uppercase tracking-wider">AFSB Varanasi</p>
                </div>
              </div>
              <p className="text-xs text-[#7984ad] mb-4 italic leading-relaxed">
                "Just got recommended from 4 AFSB! The AI Mock Interviews on SSB Connect were literally 90% identical to the real ones."
              </p>
              <div className="flex items-center gap-4 text-[#7984ad]">
                <div className="flex items-center gap-1"><Heart size={12} /> <span className="text-[10px]">142</span></div>
                <div className="flex items-center gap-1"><MessageSquare size={12} /> <span className="text-[10px]">28</span></div>
              </div>
            </div>

            {/* Post 2 */}
            <div className="glass-dark p-6 rounded-2xl border border-white/[0.05] hover:border-[#ffe08f]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAudgJklV1J_ByEzu3pg9Zij7IJHm2xNXPBKgrPBCdrxWABPTOl6KFwCXUdZhMi71EfBs1yokw7gsboGHQBHv8NdCdPdkVGbTog1y8WVt6Vow6abC5njAx5tGxvL-CeYaJIBQ_OAUkTUBV8tCY4b-w65UjkpHcvbWQIo6VbPDv91gG6mr6ofvLCLuLFsqw8XoBilWi9cWcRkfkOgemPB-eX2eRW8oXS2K7gfev0zdP3Ax5rFbLw9w9Ow1AaVRgiAHazz9tut9_GnkA9')" }}></div>
                <div>
                  <p className="font-bold text-xs text-white">Priya Mallik</p>
                  <p className="text-[9px] text-[#7984ad] uppercase tracking-wider">NDA 152 Aspirant</p>
                </div>
              </div>
              <p className="text-xs text-[#7984ad] mb-4 leading-relaxed">
                Daily Run completed. 5km in 22:40. Discipline is the only way forward. Who's joining the morning OIR session tomorrow? ⚔️
              </p>
              <div className="flex items-center gap-4 text-[#7984ad]">
                <div className="flex items-center gap-1"><Heart size={12} /> <span className="text-[10px]">89</span></div>
                <div className="flex items-center gap-1"><MessageSquare size={12} /> <span className="text-[10px]">12</span></div>
              </div>
            </div>

            {/* Post 3 */}
            <div className="glass-dark p-6 rounded-2xl border border-white/[0.05] hover:border-[#ffe08f]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAYMXolo4esT4P559QNgUnU8m8gEGzojG0ncrssJRkOmcQRamVJfU3EK50KlkP3SjIW58XgchFqSokskZYEzowzVzRF8yS0FlegAUUYUXbAlPDjpnGlpHGn_0Opsiyfhny6e3uN54C7DbQrRCC0H2lj-CJz9DOe4zlVxw8Ugs8rr6bkyOU7h6WFPGtA2K7_C1CGHtzpXe7Ebv1Ae6an3JYRKzeMxZfNkXdn7HOWfAYakMQejVAoMnKcFn49toMMciP8xt1MFKlhz41R')" }}></div>
                <div>
                  <p className="font-bold text-xs text-white">Arjun Mehta</p>
                  <p className="text-[9px] text-[#7984ad] uppercase tracking-wider">SSB Hub Master</p>
                </div>
              </div>
              <p className="text-xs text-[#7984ad] mb-4 leading-relaxed">
                Shared a new PDF on TAT Story Structures for fresher level candidates in the Hub section. Go check it out!
              </p>
              <div className="p-3 bg-[#0f1c3f] rounded-lg border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#ffe08f] w-4 h-4" />
                  <span className="text-[10px] font-semibold truncate text-[#7984ad]">TAT_Mastery_V1.pdf</span>
                </div>
                <Download className="w-4 h-4 text-[#7984ad] hover:text-[#ffe08f] cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section id="stories" className="py-20 bg-[#f2f3f7]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#ffe08f]/20 rounded-[2rem] -rotate-2"></div>
              <div className="relative rounded-[2rem] overflow-hidden aspect-video shadow-2xl bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC-XVszwG9Qgj8aDhrACv0RFXtLIeSVZb40RSXM-atBUOEAtIwSxsKQROIYhMXKFq1_ap1OJ-RlWDmFRBBXOrABuCeuasDZUqftJVENAehmEDl0F6DIgKS7zKHU2j_U5upPHTdpTqYJETb3hSOPHAK0Mmc8d5OrJRdgUwgAinh15rCj_Cd4OEjjUK5HSl91d4LQSuvzd6rNyGeCanBdSiBTJiuWGQzSrnKNg6ITJef2uckZb8WJt6KUjve4Tl_9kbOJN7yfUvqqHmPD')" }}></div>
              <div className="absolute -bottom-8 -right-4 bg-white p-5 rounded-2xl shadow-lg max-w-[220px]">
                <p className="text-[#000317] font-bold text-2xl">1,240+</p>
                <p className="text-[#6B7280] text-[9px] uppercase tracking-wider font-semibold mt-1 leading-normal">
                  Officers Recommended in 2023 via SSB Connect
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-[#000317] tracking-tight">From Aspirants to Officers.</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Our platform isn't just about social networking—it's about the result. We track every recommended candidate's journey to provide you with the exact blueprints for success.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs text-[#000317]">Vetted Strategies</p>
                    <p className="text-[#45464e] text-xs mt-0.5">Learn from those who have already made it to the academies.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs text-[#000317]">Academy Networking</p>
                    <p className="text-[#45464e] text-xs mt-0.5">Get insights about life at NDA, IMA, OTA, and AFA directly from cadets.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs text-[#000317]">Officer-Led Webinars</p>
                    <p className="text-[#45464e] text-xs mt-0.5">Monthly sessions with retired GTOs and Interviewing Officers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000317] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="text-[#ffe08f] w-8 h-8 fill-current" />
              <h1 className="text-xl font-bold text-[#ffe08f]">SSB Connect</h1>
            </div>
            <p className="text-[#7984ad] text-xs leading-relaxed mb-6">
              Empowering the next generation of Indian Armed Forces officers through community, technology, and discipline.
            </p>
            <div className="flex gap-4 text-[#7984ad]">
              <Globe className="w-5 h-5 cursor-pointer hover:text-[#ffe08f]" />
              <Share2 className="w-5 h-5 cursor-pointer hover:text-[#ffe08f]" />
              <Mail className="w-5 h-5 cursor-pointer hover:text-[#ffe08f]" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full md:w-auto">
            <div>
              <h4 className="text-[#ffe08f] font-bold mb-6 text-xs uppercase tracking-widest">Company</h4>
              <ul className="space-y-3 text-xs text-[#7984ad]">
                <li><a className="hover:text-white" href="#">About Us</a></li>
                <li><a className="hover:text-white" href="#">Our Mission</a></li>
                <li><a className="hover:text-white" href="#">Careers</a></li>
                <li><a className="hover:text-white" href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#ffe08f] font-bold mb-6 text-xs uppercase tracking-widest">Platform</h4>
              <ul className="space-y-3 text-xs text-[#7984ad]">
                <li><a className="hover:text-white" href="#features">Practice Hub</a></li>
                <li><a className="hover:text-white" href="#features">AI Mentor</a></li>
                <li><a className="hover:text-white" href="#features">OLQ Tracker</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[#ffe08f] font-bold mb-6 text-xs uppercase tracking-widest">Enlist Today</h4>
              <div className="flex bg-[#0f1c3f] rounded-lg p-1 border border-white/10 max-w-sm">
                <input className="bg-transparent border-none focus:ring-0 text-white text-xs px-3 py-2 w-full outline-none" placeholder="Email Address" type="email" />
                <button className="bg-[#ffe08f] hover:bg-[#fed977] text-[#241a00] font-bold px-4 py-1.5 rounded-md text-xs uppercase tracking-wider">Join</button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[#7984ad] text-xs">
          <p>© 2026 SSB Connect. For the Brave.</p>
          <div className="flex gap-6">
            <a className="hover:text-white" href="#">Privacy Policy</a>
            <a className="hover:text-white" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
