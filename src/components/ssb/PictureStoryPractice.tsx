import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, Play, Pause, RotateCcw, Shield, Send, Info, Eye, Award, Loader2, Brain, Upload, X, Type,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { PracticeService } from '../../services/api';

export type PracticeType = 'PPDT' | 'TAT';

interface PracticePrompt {
  id: number;
  title: string;
  image_url: string | null;
}

interface PictureStoryPracticeProps {
  type: PracticeType;
  title: string;
  subtitle: string;
  showCharacterFields?: boolean;
  evaluateStory: (params: {
    story: string;
    context?: string;
    storyImage?: File | null;
    promptId: number | null;
  }) => Promise<any>;
}

const OLQProgress = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-on-surface-variant font-medium">{label}</span>
      <span className="text-secondary font-bold">{value}%</span>
    </div>
    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
      <div className="h-full bg-secondary-fixed" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const CircularScoreRing = ({ score }: { score: number }) => {
  const strokeWidth = 6;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="secondary-fixed"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-white text-glow">{score}</span>
        <span className="text-[8px] uppercase font-bold text-outline-variant">Score</span>
      </div>
    </div>
  );
};

const RadarChart = ({ scores }: { scores: { [key: string]: number } }) => {
  const cx = 100;
  const cy = 100;
  const r = 60;
  const axes = [
    { label: 'Intelligence', key: 'effective_intelligence', angle: -Math.PI / 2 },
    { label: 'Expression', key: 'expression', angle: 0 },
    { label: 'Adaptability', key: 'social_adaptability', angle: Math.PI / 2 },
    { label: 'Initiative', key: 'initiative', angle: Math.PI },
  ];

  // Draw grid polygons (at 25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map((level) => {
    return axes
      .map((axis) => {
        const x = cx + r * level * Math.cos(axis.angle);
        const y = cy + r * level * Math.sin(axis.angle);
        return `${x},${y}`;
      })
      .join(' ');
  });

  // Calculate user data points
  const points = axes
    .map((axis) => {
      const val = scores[axis.key] ?? 50;
      const x = cx + r * (val / 100) * Math.cos(axis.angle);
      const y = cy + r * (val / 100) * Math.sin(axis.angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
      {/* Background grids */}
      {gridPolygons.map((pts, idx) => (
        <polygon
          key={idx}
          points={pts}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray={idx < 3 ? "2 2" : "none"}
        />
      ))}
      
      {/* Axes lines */}
      {axes.map((axis, idx) => {
        const x = cx + r * Math.cos(axis.angle);
        const y = cy + r * Math.sin(axis.angle);
        return (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        );
      })}

      {/* User score polygon */}
      <polygon
        points={points}
        fill="rgba(201, 168, 76, 0.2)"
        stroke="secondary-fixed"
        strokeWidth="2"
      />

      {/* User score dots */}
      {axes.map((axis, idx) => {
        const val = scores[axis.key] ?? 50;
        const x = cx + r * (val / 100) * Math.cos(axis.angle);
        const y = cy + r * (val / 100) * Math.sin(axis.angle);
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r="3.5"
            className="fill-navy-900 stroke-gold-500 stroke-2"
          />
        );
      })}

      {/* Axis Labels */}
      {axes.map((axis, idx) => {
        const offset = 14;
        const x = cx + (r + offset) * Math.cos(axis.angle);
        const y = cy + (r + offset) * Math.sin(axis.angle);
        
        let textAnchor = "middle";
        if (axis.angle === 0) textAnchor = "start";
        if (axis.angle === Math.PI) textAnchor = "end";

        return (
          <text
            key={idx}
            x={x}
            y={y + 3}
            textAnchor={textAnchor}
            className="text-[8px] font-bold fill-navy-600 uppercase tracking-wider font-sans"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
};

const VIEWING_SECONDS = 30;
const DETAILS_SECONDS = 60;
const WRITING_SECONDS = 240;

type Stage = 'intro' | 'viewing' | 'details' | 'writing' | 'evaluation';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1533619058645-bc3b50bc2c0e?auto=format&fit=crop&q=80&w=1200';

const PictureStoryPractice: React.FC<PictureStoryPracticeProps> = ({
  type,
  title,
  subtitle,
  showCharacterFields = false,
  evaluateStory,
}) => {
  const [stage, setStage] = useState<Stage>('intro');
  const [timeLeft, setTimeLeft] = useState(VIEWING_SECONDS);
  const [detailsTime, setDetailsTime] = useState(DETAILS_SECONDS);
  const [storyTime, setStoryTime] = useState(WRITING_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageBankSize, setImageBankSize] = useState<number | null>(null);
  const [prompt, setPrompt] = useState<PracticePrompt | null>(null);

  const [characterCount, setCharacterCount] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [mood, setMood] = useState('');
  const [actionText, setActionText] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyInputMode, setStoryInputMode] = useState<'type' | 'upload'>('type');
  const [storyImage, setStoryImage] = useState<File | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);

  const imageSrc = prompt?.image_url || FALLBACK_IMAGE;
  const Icon = type === 'PPDT' ? Shield : Brain;

  useEffect(() => {
    PracticeService.getImageStats()
      .then((res) => setImageBankSize(res.data[type] ?? 0))
      .catch(() => setImageBankSize(null));
  }, [type]);

  useEffect(() => {
    if (isPaused || stage === 'intro' || stage === 'evaluation') return;

    let timer: ReturnType<typeof setInterval> | undefined;

    if (stage === 'viewing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (stage === 'viewing' && timeLeft === 0) {
      setIsPaused(false);
      setDetailsTime(DETAILS_SECONDS);
      setStage(showCharacterFields ? 'details' : 'writing');
    }

    if (stage === 'details' && detailsTime > 0) {
      timer = setInterval(() => setDetailsTime((prev) => prev - 1), 1000);
    } else if (stage === 'details' && detailsTime === 0) {
      setIsPaused(false);
      setStoryTime(WRITING_SECONDS);
      setStage('writing');
    }

    if (stage === 'writing' && storyTime > 0) {
      timer = setInterval(() => setStoryTime((prev) => prev - 1), 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, timeLeft, detailsTime, storyTime, isPaused, showCharacterFields]);

  const togglePause = () => setIsPaused((prev) => !prev);

  const clearStoryImage = () => {
    if (storyImagePreview) URL.revokeObjectURL(storyImagePreview);
    setStoryImage(null);
    setStoryImagePreview(null);
    if (storyFileRef.current) storyFileRef.current.value = '';
  };

  const handleStoryFileSelect = (file: File | null) => {
    clearStoryImage();
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG or PNG).');
      return;
    }
    setStoryImage(file);
    setStoryImagePreview(URL.createObjectURL(file));
  };

  const buildDetailsContext = () =>
    showCharacterFields
      ? `Characters: ${characterCount || 'N/A'}. Age: ${age || 'N/A'}, Gender: ${gender}, Mood: ${mood || 'N/A'}. Action: ${actionText || 'N/A'}.`
      : '';

  const resetSession = () => {
    setStage('intro');
    setEvaluation(null);
    setStoryText('');
    clearStoryImage();
    setStoryInputMode('type');
    setCharacterCount('');
    setAge('');
    setMood('');
    setActionText('');
    setTimeLeft(VIEWING_SECONDS);
    setDetailsTime(DETAILS_SECONDS);
    setStoryTime(WRITING_SECONDS);
    setIsPaused(false);
    setPrompt(null);
    setImageError(null);
  };

  const loadRandomImage = async () => {
    setLoadingImage(true);
    setImageError(null);
    try {
      const res = await PracticeService.getRandomPrompt(type);
      setPrompt(res.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setImageError(
        typeof detail === 'string'
          ? detail
          : `No ${type} images imported yet. Add your PDF to backend/practice_assets/pdf/${type.toLowerCase()}/ and run the import command.`
      );
      setPrompt(null);
    } finally {
      setLoadingImage(false);
    }
  };

  const startPractice = async () => {
    await loadRandomImage();
    setTimeLeft(VIEWING_SECONDS);
    setDetailsTime(DETAILS_SECONDS);
    setStoryTime(WRITING_SECONDS);
    setIsPaused(false);
    setStage('viewing');
  };

  const startAnotherSession = async () => {
    setEvaluation(null);
    setStoryText('');
    clearStoryImage();
    setStoryInputMode('type');
    setCharacterCount('');
    setAge('');
    setMood('');
    setActionText('');
    setTimeLeft(VIEWING_SECONDS);
    setDetailsTime(DETAILS_SECONDS);
    setStoryTime(WRITING_SECONDS);
    setIsPaused(false);
    await loadRandomImage();
    setStage('viewing');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitStory = async () => {
    if (storyInputMode === 'type' && !storyText.trim()) {
      alert('Please write your story or upload a photo of your handwritten answer.');
      return;
    }
    if (storyInputMode === 'upload' && !storyImage) {
      alert('Please upload a clear photo of your handwritten story.');
      return;
    }
    setIsSubmitting(true);
    const storyBody = storyInputMode === 'type' ? storyText : '';
    const responseText = showCharacterFields
      ? `${buildDetailsContext()} Story: ${storyBody || '[handwritten photo submission]'}`
      : storyBody || '[handwritten photo submission]';
    try {
      const response = await evaluateStory({
        story: storyBody,
        context: buildDetailsContext(),
        storyImage: storyInputMode === 'upload' ? storyImage : null,
        promptId: prompt?.id ?? null,
      });
      setEvaluation(response.data);
      try {
        await PracticeService.saveSubmission({
          practice_type: type,
          prompt: prompt?.id ?? null,
          response: responseText,
          metadata: {
            characterCount,
            age,
            gender,
            mood,
            actionText,
            inputMode: storyInputMode,
          },
          evaluation: response.data,
        });
      } catch (saveErr) {
        console.warn('Could not save practice session to server:', saveErr);
      }
      setStage('evaluation');
    } catch (error: any) {
      console.error('Failed to evaluate story:', error);
      alert(
        error.response?.data?.detail ||
          'Failed to reach AI evaluation server. Please ensure the backend is running and Groq API Key is configured.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">{title}</h1>
          <p className="text-text-secondary text-sm">{subtitle}</p>
        </div>
        {stage === 'writing' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              className={cn(
                'px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all',
                isPaused
                  ? 'bg-secondary-fixed text-primary hover:bg-gold-400'
                  : 'bg-white text-primary border border-navy-200 hover:bg-surface-container-low'
              )}
              title={isPaused ? 'Resume timer' : 'Pause timer (emergency)'}
            >
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <div
              className={cn(
                'px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm',
                isPaused && 'opacity-70',
                'bg-red-50 text-red-600'
              )}
            >
              <Timer size={20} />
              {formatTime(storyTime)}
            </div>
          </div>
        )}
      </div>

      {isPaused && (stage === 'viewing' || stage === 'details' || stage === 'writing') && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gold-200 bg-secondary-fixed/10 px-4 py-3 text-sm text-primary">
          <Pause size={18} className="text-secondary flex-shrink-0" />
          <p>
            <span className="font-bold">Timer paused.</span> Use this for emergencies — press{' '}
            <span className="font-bold">Resume</span> when you are ready to continue.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-12 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gold-100 rounded-3xl flex items-center justify-center text-secondary mx-auto mb-6">
                <Icon size={40} />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-4">Ready to Begin?</h2>
              {imageBankSize != null && imageBankSize > 0 && (
                <p className="text-sm font-bold text-accent-600 mb-4">
                  {imageBankSize} pictures loaded from your {type} PDF — a random one each session.
                </p>
              )}
              <div className="text-left bg-surface-container-low p-6 rounded-2xl mb-8 space-y-3">
                <div className="flex gap-3 text-sm">
                  <Info className="text-outline flex-shrink-0" size={18} />
                  <p className="text-primary">
                    A random picture from your <b>{type}</b> image bank is shown for <b>30 seconds</b>.
                  </p>
                </div>
                {showCharacterFields ? (
                  <>
                    <div className="flex gap-3 text-sm">
                      <Info className="text-outline flex-shrink-0" size={18} />
                      <p className="text-primary">
                        Then <b>1 minute</b> to write action &amp; character details — <b>image hidden</b>.
                      </p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Info className="text-outline flex-shrink-0" size={18} />
                      <p className="text-primary">
                        Finally <b>4 minutes</b> to write your story (image stays hidden).
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-3 text-sm">
                    <Info className="text-outline flex-shrink-0" size={18} />
                    <p className="text-primary">
                      After that, you will have <b>4 minutes</b> to write your story.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 text-sm">
                  <Pause className="text-outline flex-shrink-0" size={18} />
                  <p className="text-primary">
                    Use <b>Pause / Resume</b> anytime during viewing or writing for emergencies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={startPractice}
                disabled={loadingImage}
                className="bg-primary text-white px-12 py-4 rounded-2xl font-bold hover:bg-primary-container transition-all flex items-center gap-3 mx-auto shadow-xl shadow-navy-900/20 disabled:opacity-50"
              >
                {loadingImage ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Loading picture...
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" /> Start Practice
                  </>
                )}
              </button>
            </Card>
          </motion.div>
        )}

        {stage === 'viewing' && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000317]/95 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#161B22]/90 border border-white/10 rounded-[24px] shadow-[0_0_50px_rgba(201,168,76,0.15)] flex flex-col p-6 space-y-6">
              <div className="flex justify-between items-center bg-[#000317] p-4 rounded-xl border border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                  {type} - Picture Observation Stage
                </span>
                <div className="flex items-center gap-2 text-gold-400">
                  <Timer size={16} />
                  <span className="font-bold text-glow text-lg">
                    {isPaused ? 'Paused' : `${timeLeft}s`}
                  </span>
                </div>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full">
                <div
                  className="h-full bg-secondary-fixed transition-all duration-1000"
                  style={{ width: `${(timeLeft / VIEWING_SECONDS) * 100}%` }}
                />
              </div>
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/2] max-h-[400px] flex items-center justify-center border border-white/5">
                <img
                  src={imageSrc}
                  className={cn(
                    "w-full h-full object-contain transition-all duration-300",
                    isPaused ? "blur-md select-none opacity-20" : ""
                  )}
                  alt="Observation print"
                />
                {isPaused && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <p className="text-sm font-bold text-white uppercase tracking-wider">
                      Click resume to observe
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-outline-variant">
                  Observe the image details: characters, setting, and mood.
                </p>
                <button
                  type="button"
                  onClick={togglePause}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all tracking-wide uppercase",
                    isPaused
                      ? "bg-secondary-fixed text-primary hover:bg-gold-400"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  )}
                >
                  {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'details' && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000317]/95 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-[#161B22]/90 border border-white/10 rounded-[24px] shadow-[0_0_50px_rgba(201,168,76,0.15)] flex flex-col p-6 space-y-6">
              <div className="flex justify-between items-center bg-[#000317] p-4 rounded-xl border border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                  Step 2 - Character & Action Details
                </span>
                <div className="flex items-center gap-2 text-gold-400">
                  <Timer size={16} />
                  <span className="font-bold text-glow text-lg">
                    {isPaused ? 'Paused' : `${detailsTime}s`}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-outline-variant">
                <span className="font-bold text-gold-400">Image hidden.</span> Specify the character count and observations.
              </div>
              <div className="space-y-4 text-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-outline-variant">Characters</label>
                    <input
                      placeholder="e.g. 3"
                      value={characterCount}
                      onChange={(e) => setCharacterCount(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-outline-variant">Age</label>
                    <input
                      placeholder="e.g. 24"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-outline-variant">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 text-white outline-none"
                    >
                      <option className="bg-[#161B22] text-white">Male</option>
                      <option className="bg-[#161B22] text-white">Female</option>
                      <option className="bg-[#161B22] text-white">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-outline-variant">Mood (+/-/0)</label>
                    <input
                      placeholder="Positive / Neutral"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 text-white outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-outline-variant">Action of the story</label>
                  <input
                    placeholder="Briefly state what the main character is doing..."
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-gold-500 text-white outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStoryTime(WRITING_SECONDS);
                    setStage('writing');
                  }}
                  className="bg-secondary-fixed text-primary font-bold px-6 py-3 rounded-xl hover:bg-gold-400 transition-all text-xs uppercase tracking-wider"
                >
                  Continue to Story Writing →
                </button>
                <button
                  type="button"
                  onClick={togglePause}
                  className="bg-white/5 border border-white/10 text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-wider"
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'writing' && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 shadow-sm">
                {showCharacterFields && (
                  <div className="mb-4 rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
                    <span className="font-bold">Your details:</span>{' '}
                    {characterCount || '?'} chars · {age || '?'} · {gender} · mood {mood || '?'} ·{' '}
                    {actionText || 'no action yet'}
                  </div>
                )}

                <div className="flex gap-2 mb-4 p-1 bg-surface-container-low rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setStoryInputMode('type')}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all',
                      storyInputMode === 'type'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-text-secondary hover:text-primary'
                    )}
                  >
                    <Type size={16} /> Type story
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryInputMode('upload')}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all',
                      storyInputMode === 'upload'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-text-secondary hover:text-primary'
                    )}
                  >
                    <Upload size={16} /> Upload photo
                  </button>
                </div>

                {storyInputMode === 'type' ? (
                  <textarea
                    placeholder="Start writing your story here..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-2xl p-6 text-sm min-h-[300px] focus:ring-2 focus:ring-accent-400 resize-none"
                  />
                ) : (
                  <div className="space-y-4">
                    <input
                      ref={storyFileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleStoryFileSelect(e.target.files?.[0] ?? null)}
                    />
                    {!storyImagePreview ? (
                      <button
                        type="button"
                        onClick={() => storyFileRef.current?.click()}
                        className="w-full min-h-[280px] border-2 border-dashed border-navy-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-text-secondary hover:border-gold-400 hover:bg-secondary-fixed/10/50 transition-all"
                      >
                        <Upload size={36} className="text-outline" />
                        <span className="font-bold text-primary">Upload handwritten story</span>
                        <span className="text-xs">Take a photo or choose from gallery</span>
                      </button>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/30">
                        <img
                          src={storyImagePreview}
                          alt="Handwritten story"
                          className="w-full max-h-[400px] object-contain bg-surface-container-low"
                        />
                        <button
                          type="button"
                          onClick={clearStoryImage}
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-on-surface-variant hover:text-red-500"
                          aria-label="Remove image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-text-secondary">
                      AI will read your handwriting from the photo and review your story.
                    </p>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitStory}
                    disabled={isSubmitting}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Reviewing...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Submit for AI Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {!showCharacterFields && (
                <Card className="p-6">
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <Eye size={18} className="text-outline" /> Reference Image
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden grayscale blur-[1px]">
                    <img src={imageSrc} className="w-full h-full object-cover" alt="Reference" />
                  </div>
                </Card>
              )}
              {showCharacterFields && (
                <Card className="p-6 border border-outline-variant/30">
                  <p className="text-sm text-on-surface-variant">
                    <span className="font-bold text-primary">Image hidden.</span> Write your story from memory.
                  </p>
                </Card>
              )}
              <Card className="p-6 bg-accent-900 text-white">
                <h3 className="font-bold mb-4">OLQ Focus</h3>
                <ul className="space-y-3 text-xs text-accent-200">
                  <li>• Effective Intelligence</li>
                  <li>• Power of Expression</li>
                  <li>• Social Adaptability</li>
                  <li>• Initiative</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        )}

        {stage === 'evaluation' && evaluation && (() => {
          const olqScores = evaluation.olq_scores || {};
          const scoreValues = [
            olqScores.effective_intelligence,
            olqScores.expression,
            olqScores.social_adaptability,
            olqScores.initiative,
          ].filter((s) => typeof s === 'number');
          const averageScore = scoreValues.length > 0
            ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
            : 75;

          return (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="bg-primary text-white rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <span className="bg-secondary-fixed text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                    Psychology Assessment Complete
                  </span>
                  <h2 className="text-3xl font-display font-bold mb-2">OLQ Evaluation — {type}</h2>
                  <p className="text-outline-variant text-sm">
                    Automated evaluation powered by Groq based on standard SSB selection parameters.
                  </p>
                </div>
                <CircularScoreRing score={averageScore} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
                      <Award className="text-secondary-fixed" /> OLQ Score Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <OLQProgress
                          label="Effective Intelligence"
                          value={olqScores.effective_intelligence || 50}
                        />
                        <OLQProgress label="Power of Expression" value={olqScores.expression || 50} />
                        <OLQProgress
                          label="Social Adaptability"
                          value={olqScores.social_adaptability || 50}
                        />
                        <OLQProgress
                          label="Initiative & Resourcefulness"
                          value={olqScores.initiative || 50}
                        />
                      </div>
                      <div className="flex justify-center border-t md:border-t-0 md:border-l border-outline-variant/30 pt-6 md:pt-0 md:pl-6">
                        <RadarChart scores={olqScores} />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                      <Info className="text-outline" /> Story Theme & Character Analysis
                    </h3>
                    <div className="space-y-4 text-sm text-primary">
                      {evaluation.transcribed_story && (
                        <div className="bg-secondary-fixed/10 p-4 rounded-xl border border-secondary-fixed/30">
                          <p className="font-bold text-primary text-xs uppercase mb-1">
                            Read from your photo
                          </p>
                          <p className="whitespace-pre-line">{evaluation.transcribed_story}</p>
                        </div>
                      )}
                      <div className="bg-surface-container-low p-4 rounded-xl">
                        <p className="font-bold text-primary text-xs uppercase mb-1">Identified Theme</p>
                        <p>{evaluation.theme}</p>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-xl">
                        <p className="font-bold text-primary text-xs uppercase mb-1">Character Perception</p>
                        <p>{evaluation.characters}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold text-primary mb-4 font-display">Detailed Psychology Feedback</h3>
                    <div className="text-sm text-primary leading-relaxed whitespace-pre-line bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/30">
                      {evaluation.feedback}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6 border-2 border-secondary-fixed">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-primary flex items-center gap-2">
                        <Icon className="text-secondary-fixed" /> Recommended Story Version
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(evaluation.revised_story);
                          alert('Story copied to clipboard!');
                        }}
                        className="text-xs font-bold text-secondary hover:underline"
                      >
                        COPY
                      </button>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl text-xs text-primary italic leading-relaxed whitespace-pre-line max-h-[320px] overflow-y-auto border border-outline-variant/30">
                      &ldquo;{evaluation.revised_story}&rdquo;
                    </div>
                  </Card>

                  <button
                    type="button"
                    onClick={startAnotherSession}
                    disabled={loadingImage}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingImage ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                    Next Random Picture
                  </button>
                  <button
                    type="button"
                    onClick={resetSession}
                    className="w-full border border-navy-200 text-primary py-3 rounded-2xl font-bold hover:bg-surface-container-low transition-all"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default PictureStoryPractice;
