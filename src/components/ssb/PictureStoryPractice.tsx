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
      <span className="text-navy-600 font-medium">{label}</span>
      <span className="text-gold-600 font-bold">{value}%</span>
    </div>
    <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
      <div className="h-full bg-gold-500" style={{ width: `${value}%` }} />
    </div>
  </div>
);

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
          <h1 className="text-2xl font-display font-bold text-navy-900">{title}</h1>
          <p className="text-navy-500 text-sm">{subtitle}</p>
        </div>
        {stage === 'writing' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              className={cn(
                'px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all',
                isPaused
                  ? 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                  : 'bg-white text-navy-900 border border-navy-200 hover:bg-navy-50'
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
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-navy-800">
          <Pause size={18} className="text-gold-600 flex-shrink-0" />
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
              <div className="w-20 h-20 bg-gold-100 rounded-3xl flex items-center justify-center text-gold-600 mx-auto mb-6">
                <Icon size={40} />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-4">Ready to Begin?</h2>
              {imageBankSize != null && imageBankSize > 0 && (
                <p className="text-sm font-bold text-army-600 mb-4">
                  {imageBankSize} pictures loaded from your {type} PDF — a random one each session.
                </p>
              )}
              <div className="text-left bg-navy-50 p-6 rounded-2xl mb-8 space-y-3">
                <div className="flex gap-3 text-sm">
                  <Info className="text-navy-400 flex-shrink-0" size={18} />
                  <p className="text-navy-700">
                    A random picture from your <b>{type}</b> image bank is shown for <b>30 seconds</b>.
                  </p>
                </div>
                {showCharacterFields ? (
                  <>
                    <div className="flex gap-3 text-sm">
                      <Info className="text-navy-400 flex-shrink-0" size={18} />
                      <p className="text-navy-700">
                        Then <b>1 minute</b> to write action &amp; character details — <b>image hidden</b>.
                      </p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Info className="text-navy-400 flex-shrink-0" size={18} />
                      <p className="text-navy-700">
                        Finally <b>4 minutes</b> to write your story (image stays hidden).
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-3 text-sm">
                    <Info className="text-navy-400 flex-shrink-0" size={18} />
                    <p className="text-navy-700">
                      After that, you will have <b>4 minutes</b> to write your story.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 text-sm">
                  <Pause className="text-navy-400 flex-shrink-0" size={18} />
                  <p className="text-navy-700">
                    Use <b>Pause / Resume</b> anytime during viewing or writing for emergencies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={startPractice}
                disabled={loadingImage}
                className="bg-navy-900 text-white px-12 py-4 rounded-2xl font-bold hover:bg-navy-800 transition-all flex items-center gap-3 mx-auto shadow-xl shadow-navy-900/20 disabled:opacity-50"
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
          <motion.div key="viewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {imageError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {imageError} Using a placeholder image for now.
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
              <div className="flex-1 min-w-0 aspect-video bg-navy-50 rounded-3xl overflow-hidden border border-navy-100">
                <img
                  src={imageSrc}
                  className="w-full h-full object-contain"
                  alt={`${type} practice`}
                />
              </div>
              <div className="sm:w-48 md:w-52 flex sm:flex-col justify-center gap-3 p-4 bg-white rounded-2xl border border-navy-100 shadow-sm shrink-0">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wide mb-1">
                    {isPaused ? 'Paused' : 'Time left'}
                  </p>
                  <p className="text-lg font-bold text-navy-900 leading-tight">
                    {isPaused ? 'Observe when ready' : formatTime(timeLeft)}
                  </p>
                </div>
                {prompt?.title && (
                  <p className="text-xs font-medium text-navy-500 text-center sm:text-left">{prompt.title}</p>
                )}
                <button
                  type="button"
                  onClick={togglePause}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all w-full',
                    isPaused
                      ? 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                      : 'bg-navy-900 text-white hover:bg-navy-800'
                  )}
                >
                  {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            </div>
            {showCharacterFields && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-navy-100 text-center">
                  <p className="text-xs font-bold text-navy-400 uppercase">Characters</p>
                  <p className="text-lg font-bold text-navy-900">?</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-navy-100 text-center">
                  <p className="text-xs font-bold text-navy-400 uppercase">Mood</p>
                  <p className="text-lg font-bold text-navy-900">?</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-navy-100 text-center">
                  <p className="text-xs font-bold text-navy-400 uppercase">Action</p>
                  <p className="text-lg font-bold text-navy-900">?</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {stage === 'details' && (
          <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-2xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700">
              <span className="font-bold">Image hidden.</span> Write the number of characters and details you observed.
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
              <div className="flex-1 bg-white rounded-3xl border border-navy-100 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-navy-900">Character &amp; Action Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <input
                    placeholder="No. of characters"
                    value={characterCount}
                    onChange={(e) => setCharacterCount(e.target.value)}
                    className="bg-navy-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500 col-span-2 sm:col-span-1"
                  />
                  <input
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="bg-navy-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-navy-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <input
                    placeholder="Mood (+/-/0)"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="bg-navy-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <input
                  placeholder="Action of the story..."
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="w-full bg-navy-50 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-gold-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStoryTime(WRITING_SECONDS);
                    setStage('writing');
                  }}
                  className="text-sm font-bold text-gold-600 hover:underline"
                >
                  Done early? Continue to story writing →
                </button>
              </div>
              <div className="sm:w-48 md:w-52 flex sm:flex-col justify-center gap-3 p-4 bg-white rounded-2xl border border-navy-100 shadow-sm shrink-0">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wide mb-1">
                    {isPaused ? 'Paused' : 'Details time'}
                  </p>
                  <p className="text-lg font-bold text-navy-900 leading-tight">
                    {isPaused ? 'Write when ready' : formatTime(detailsTime)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={togglePause}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all w-full',
                    isPaused
                      ? 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                      : 'bg-navy-900 text-white hover:bg-navy-800'
                  )}
                >
                  {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'writing' && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-navy-100 p-6 shadow-sm">
                {showCharacterFields && (
                  <div className="mb-4 rounded-xl bg-navy-50 p-3 text-xs text-navy-600">
                    <span className="font-bold">Your details:</span>{' '}
                    {characterCount || '?'} chars · {age || '?'} · {gender} · mood {mood || '?'} ·{' '}
                    {actionText || 'no action yet'}
                  </div>
                )}

                <div className="flex gap-2 mb-4 p-1 bg-navy-50 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setStoryInputMode('type')}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all',
                      storyInputMode === 'type'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-navy-500 hover:text-navy-700'
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
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-navy-500 hover:text-navy-700'
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
                    className="w-full bg-navy-50 border-none rounded-2xl p-6 text-sm min-h-[300px] focus:ring-2 focus:ring-gold-500 resize-none"
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
                        className="w-full min-h-[280px] border-2 border-dashed border-navy-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-navy-500 hover:border-gold-400 hover:bg-gold-50/50 transition-all"
                      >
                        <Upload size={36} className="text-navy-400" />
                        <span className="font-bold text-navy-700">Upload handwritten story</span>
                        <span className="text-xs">Take a photo or choose from gallery</span>
                      </button>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-navy-100">
                        <img
                          src={storyImagePreview}
                          alt="Handwritten story"
                          className="w-full max-h-[400px] object-contain bg-navy-50"
                        />
                        <button
                          type="button"
                          onClick={clearStoryImage}
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md text-navy-600 hover:text-red-500"
                          aria-label="Remove image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-navy-500">
                      AI will read your handwriting from the photo and review your story.
                    </p>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitStory}
                    disabled={isSubmitting}
                    className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-800 transition-all flex items-center gap-2 disabled:opacity-50"
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
                  <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <Eye size={18} className="text-navy-400" /> Reference Image
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden grayscale blur-[1px]">
                    <img src={imageSrc} className="w-full h-full object-cover" alt="Reference" />
                  </div>
                </Card>
              )}
              {showCharacterFields && (
                <Card className="p-6 border border-navy-100">
                  <p className="text-sm text-navy-600">
                    <span className="font-bold text-navy-900">Image hidden.</span> Write your story from memory.
                  </p>
                </Card>
              )}
              <Card className="p-6 bg-army-900 text-white">
                <h3 className="font-bold mb-4">OLQ Focus</h3>
                <ul className="space-y-3 text-xs text-army-200">
                  <li>• Effective Intelligence</li>
                  <li>• Power of Expression</li>
                  <li>• Social Adaptability</li>
                  <li>• Initiative</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        )}

        {stage === 'evaluation' && evaluation && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="bg-navy-900 text-white rounded-3xl p-8">
              <span className="bg-gold-500 text-navy-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                Psychology Assessment Complete
              </span>
              <h2 className="text-3xl font-display font-bold mb-2">OLQ Evaluation — {type}</h2>
              <p className="text-navy-300 text-sm">
                Automated evaluation powered by Groq based on standard SSB selection parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="font-bold text-navy-900 mb-6 flex items-center gap-2">
                    <Award className="text-gold-500" /> OLQ Score Breakdown
                  </h3>
                  <div className="space-y-4">
                    <OLQProgress
                      label="Effective Intelligence"
                      value={evaluation.olq_scores?.effective_intelligence || 50}
                    />
                    <OLQProgress label="Power of Expression" value={evaluation.olq_scores?.expression || 50} />
                    <OLQProgress
                      label="Social Adaptability"
                      value={evaluation.olq_scores?.social_adaptability || 50}
                    />
                    <OLQProgress
                      label="Initiative & Resourcefulness"
                      value={evaluation.olq_scores?.initiative || 50}
                    />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <Info className="text-navy-400" /> Story Theme & Character Analysis
                  </h3>
                  <div className="space-y-4 text-sm text-navy-800">
                    {evaluation.transcribed_story && (
                      <div className="bg-gold-50 p-4 rounded-xl border border-gold-100">
                        <p className="font-bold text-navy-900 text-xs uppercase mb-1">
                          Read from your photo
                        </p>
                        <p className="whitespace-pre-line">{evaluation.transcribed_story}</p>
                      </div>
                    )}
                    <div className="bg-navy-50 p-4 rounded-xl">
                      <p className="font-bold text-navy-900 text-xs uppercase mb-1">Identified Theme</p>
                      <p>{evaluation.theme}</p>
                    </div>
                    <div className="bg-navy-50 p-4 rounded-xl">
                      <p className="font-bold text-navy-900 text-xs uppercase mb-1">Character Perception</p>
                      <p>{evaluation.characters}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-navy-900 mb-4 font-display">Detailed Psychology Feedback</h3>
                  <div className="text-sm text-navy-700 leading-relaxed whitespace-pre-line bg-navy-50/50 p-4 rounded-2xl border border-navy-100">
                    {evaluation.feedback}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border-2 border-gold-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy-900 flex items-center gap-2">
                      <Icon className="text-gold-500" /> Recommended Story Version
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(evaluation.revised_story);
                        alert('Story copied to clipboard!');
                      }}
                      className="text-xs font-bold text-gold-600 hover:underline"
                    >
                      COPY
                    </button>
                  </div>
                  <div className="bg-navy-50 p-4 rounded-xl text-xs text-navy-700 italic leading-relaxed whitespace-pre-line max-h-[320px] overflow-y-auto border border-navy-100">
                    &ldquo;{evaluation.revised_story}&rdquo;
                  </div>
                </Card>

                <button
                  type="button"
                  onClick={startAnotherSession}
                  disabled={loadingImage}
                  className="w-full bg-navy-900 text-white py-4 rounded-2xl font-bold hover:bg-navy-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                  className="w-full border border-navy-200 text-navy-700 py-3 rounded-2xl font-bold hover:bg-navy-50 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PictureStoryPractice;
