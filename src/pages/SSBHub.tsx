import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import {
  Timer,
  PenTool,
  Brain,
  Users,
  ChevronRight,
  Play,
  Award,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { FeedService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface ExperiencePost {
  id: string;
  author_username: string;
  title: string;
  body: string;
  post_type: string;
  created_at: string;
}

const modules = [
  { id: 'ppdt', title: 'PPDT Practice', icon: PenTool, accent: 'bg-accent-500', desc: 'Picture Perception & Discussion Test', path: '/ssb/ppdt' },
  { id: 'tat', title: 'TAT Practice', icon: Brain, accent: 'bg-tertiary-container text-tertiary-fixed', desc: 'Thematic Apperception Test', path: '/ssb/tat' },
  { id: 'wat', title: 'WAT Practice', icon: Timer, accent: 'bg-secondary-fixed text-on-secondary-fixed', desc: 'Word Association Test', path: '/ssb/wat' },
  { id: 'srt', title: 'SRT Practice', icon: Users, accent: 'bg-primary-container text-on-primary', desc: 'Situation Reaction Test', path: '/ssb/srt' },
];

const SSBHub = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<ExperiencePost[]>([]);
  const [loadingExp, setLoadingExp] = useState(true);

  useEffect(() => {
    FeedService.getPosts(1, { postType: 'EXPERIENCE', feed: 'all' })
      .then((res) => {
        const data = res.data.results ?? res.data;
        setExperiences(Array.isArray(data) ? data.slice(0, 5) : []);
      })
      .catch(() => setExperiences([]))
      .finally(() => setLoadingExp(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto pt-20 pb-10 px-4 md:px-8 bg-background min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="ssb-page-title">SSB Practice Hub</h1>
              <p className="ssb-page-sub">Sharpen your OLQs through structured practice modules.</p>
            </div>
            <div className="flex bg-surface-container p-1 rounded-full border border-outline-variant/20">
              <button type="button" className="px-5 py-2 rounded-full text-xs font-bold bg-primary text-on-primary shadow-sm">
                Practice
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai-mentor')}
                className="px-5 py-2 rounded-full text-xs font-bold text-text-secondary hover:text-primary transition-colors"
              >
                AI Mentor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className="p-6 card-hover cursor-pointer group border-outline-variant/20"
                  onClick={() => navigate(module.path)}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-md', module.accent)}>
                      <Icon size={22} />
                    </div>
                    <ChevronRight className="text-outline group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="mt-4 font-bold text-lg text-primary">{module.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{module.desc}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(module.path); }}
                    className="mt-6 flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors"
                  >
                    <Play size={16} fill="currentColor" /> Start Practice
                  </button>
                </Card>
              );
            })}
          </div>

          <div>
            <h2 className="text-headline-sm font-bold text-primary mb-4">Recent Experiences</h2>
            {loadingExp ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-secondary-fixed" size={28} />
              </div>
            ) : experiences.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-text-secondary">No experience posts yet. Share yours from the Feed!</p>
                <Link to="/feed" className="text-sm font-bold text-secondary hover:underline mt-2 inline-block">
                  Go to Feed →
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {experiences.map((post) => (
                  <Card key={post.id} className="p-5 hover:translate-y-[-2px] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_username}`}
                        alt=""
                        className="w-8 h-8 rounded-full border border-secondary-fixed/30"
                      />
                      <div>
                        <p className="text-xs font-bold text-primary">@{post.author_username}</p>
                        <p className="text-[10px] text-text-secondary">
                          {(() => {
                            try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); }
                            catch { return ''; }
                          })()}
                        </p>
                      </div>
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-tertiary-fixed/30 text-tertiary-container px-2 py-0.5 rounded-full">
                        {post.post_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-primary">{post.title || 'SSB Experience'}</h4>
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{post.body}</p>
                    <Link to="/feed" className="text-secondary text-xs font-bold hover:underline mt-3 inline-block">
                      Read More
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="p-6 bg-primary text-on-primary border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary-fixed">Your OLQ Profile</h3>
              <Award className="text-secondary-fixed" />
            </div>
            <p className="text-sm text-on-primary-container mb-5">
              Complete PPDT practice with AI evaluation to build your officer-like qualities profile.
            </p>
            <button
              type="button"
              onClick={() => navigate('/ssb/ppdt')}
              className="w-full ssb-btn-gold py-3"
            >
              Start PPDT Evaluation
            </button>
          </Card>

          <Card className="p-5 border-secondary-fixed/20 bg-secondary-fixed/5">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-secondary flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-primary text-sm mb-1">Daily SSB Tip</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  In WAT, respond with the first positive association — hesitation signals lack of spontaneity.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-primary mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: 'AI Mentor Chat', path: '/ai-mentor' },
                { label: 'Study Groups', path: '/groups' },
                { label: 'Mock Sessions & Events', path: '/events' },
              ].map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className="w-full text-left p-3 bg-surface-container-low rounded-xl text-sm font-medium text-primary hover:bg-surface-container transition-colors"
                >
                  {link.label} →
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default SSBHub;
