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
} from 'lucide-react';
import { FeedService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

interface ExperiencePost {
  id: string;
  author_username: string;
  title: string;
  body: string;
  post_type: string;
  created_at: string;
}

const SSBHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('practice');
  const [experiences, setExperiences] = useState<ExperiencePost[]>([]);
  const [loadingExp, setLoadingExp] = useState(true);

  const modules = [
    { id: 'ppdt', title: 'PPDT Practice', icon: <PenTool />, color: 'bg-accent-500', desc: 'Picture Perception & Discussion Test', path: '/ssb/ppdt' },
    { id: 'tat', title: 'TAT Practice', icon: <Brain />, color: 'bg-army-700', desc: 'Thematic Apperception Test', path: '/ssb/tat' },
    { id: 'wat', title: 'WAT Practice', icon: <Timer />, color: 'bg-gold-500', desc: 'Word Association Test', path: '/ssb/wat' },
    { id: 'srt', title: 'SRT Practice', icon: <Users />, color: 'bg-midnight-700', desc: 'Situation Reaction Test', path: '/ssb/srt' },
  ];

  useEffect(() => {
    FeedService.getPosts(1, { postType: 'EXPERIENCE', feed: 'all' })
      .then((res) => {
        const data = res.data.results ?? res.data;
        setExperiences(Array.isArray(data) ? data.slice(0, 5) : []);
      })
      .catch(() => setExperiences([]))
      .finally(() => setLoadingExp(false));
  }, []);

  const handleModuleStart = (path: string) => {
    if (path.includes('ai-mentor')) {
      navigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-20 pb-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-navy-900">SSB Practice Hub</h1>
            <div className="flex bg-navy-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'practice' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}
              >
                Practice
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai-mentor')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'ai' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}
              >
                AI Mentor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => (
              <Card
                key={module.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleModuleStart(module.path)}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 ${module.color} text-white rounded-xl flex items-center justify-center shadow-lg`}>
                    {module.icon}
                  </div>
                  <ChevronRight className="text-navy-300 group-hover:text-navy-900 transition-colors" />
                </div>
                <h3 className="mt-4 font-bold text-lg text-navy-900">{module.title}</h3>
                <p className="text-sm text-navy-500 mt-1">{module.desc}</p>
                <div className="mt-6 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleModuleStart(module.path); }}
                    className="flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-gold-600"
                  >
                    <Play size={16} fill="currentColor" /> Start Session
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold text-navy-900 mb-4">Recent SSB Experiences</h2>
            {loadingExp ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-navy-400" size={28} />
              </div>
            ) : experiences.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-navy-500">No experience posts yet. Share yours from the Feed!</p>
                <Link to="/feed" className="text-sm font-bold text-gold-600 hover:underline mt-2 inline-block">
                  Go to Feed →
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {experiences.map((post) => (
                  <Card key={post.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="px-2 py-1 bg-navy-900 text-white text-[10px] font-bold rounded uppercase">
                        {post.post_type.replace('_', ' ')}
                      </div>
                      <span className="text-xs text-navy-500">
                        {(() => {
                          try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); }
                          catch { return ''; }
                        })()}
                      </span>
                    </div>
                    <h4 className="font-bold text-navy-900">{post.title || 'SSB Experience'}</h4>
                    <p className="text-sm text-navy-600 mt-2 line-clamp-2">{post.body}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Link
                        to={`/profile/${post.author_username}`}
                        className="flex items-center gap-2 hover:opacity-80"
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_username}`}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs font-medium">@{post.author_username}</span>
                      </Link>
                      <Link to="/feed" className="text-gold-600 text-xs font-bold hover:underline">
                        View on Feed
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-navy-900 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Your OLQ Profile</h3>
              <Award className="text-gold-500" />
            </div>
            <p className="text-sm text-navy-300 mb-4">
              Complete PPDT practice with AI evaluation to build your OLQ profile.
            </p>
            <button
              type="button"
              onClick={() => navigate('/ssb/ppdt')}
              className="w-full bg-gold-500 text-navy-900 py-3 rounded-lg font-bold hover:bg-gold-600 transition-colors"
            >
              Start PPDT Evaluation
            </button>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-navy-900 mb-4">Quick Links</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/ai-mentor')}
                className="w-full text-left p-3 bg-navy-50 rounded-lg text-sm font-medium text-navy-900 hover:bg-navy-100"
              >
                AI Mentor Chat →
              </button>
              <button
                type="button"
                onClick={() => navigate('/groups')}
                className="w-full text-left p-3 bg-navy-50 rounded-lg text-sm font-medium text-navy-900 hover:bg-navy-100"
              >
                Study Groups →
              </button>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="w-full text-left p-3 bg-navy-50 rounded-lg text-sm font-medium text-navy-900 hover:bg-navy-100"
              >
                Mock Sessions & Events →
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SSBHub;
