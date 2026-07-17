import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Send, Loader2, Award, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { PracticeService } from '../../services/api';

export type TimedPracticeType = 'WAT' | 'SRT';

interface PromptItem {
  id: number;
  title: string;
  text: string;
}

interface TimedPromptPracticeProps {
  type: TimedPracticeType;
  title: string;
  subtitle: string;
  secondsPerItem: number;
  itemCount: number;
  promptLabel: string;
  answerPlaceholder: string;
  evaluateBatch: (items: { prompt: string; response: string }[]) => Promise<{ data: any }>;
}

type Stage = 'intro' | 'session' | 'evaluation';

const TimerProgress = ({ time, maxTime }: { time: number; maxTime: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (time / maxTime) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="rgba(226, 232, 240, 0.5)"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke={time <= 4 ? "#ef4444" : "secondary-fixed"}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={cn(
        "absolute text-xs font-bold",
        time <= 4 ? "text-red-500 animate-pulse font-extrabold" : "text-primary"
      )}>
        {time}
      </span>
    </div>
  );
};

const TimedPromptPractice: React.FC<TimedPromptPracticeProps> = ({
  type,
  title,
  subtitle,
  secondsPerItem,
  itemCount,
  promptLabel,
  answerPlaceholder,
  evaluateBatch,
}) => {
  const [stage, setStage] = useState<Stage>('intro');
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(secondsPerItem);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [bankSize, setBankSize] = useState<number | null>(null);

  useEffect(() => {
    PracticeService.getImageStats()
      .then((res) => setBankSize(res.data[type] ?? 0))
      .catch(() => setBankSize(null));
  }, [type]);

  const formatTime = (s: number) => `${s}s`;

  const goNext = useCallback(() => {
    const merged = { ...answers };
    const active = prompts[currentIndex];
    if (active) merged[active.id] = currentAnswer.trim();

    if (currentIndex + 1 >= prompts.length) {
      setSubmitting(true);
      const items = prompts.map((p) => ({
        prompt: p.text,
        response: merged[p.id]?.trim() || '(no answer)',
      }));
      evaluateBatch(items)
        .then(async (res) => {
          setEvaluation(res.data);
          const responseText = items.map((i) => `${i.prompt} → ${i.response}`).join('\n');
          try {
            await PracticeService.saveSubmission({
              practice_type: type,
              response: responseText,
              metadata: { items, secondsPerItem, itemCount },
              evaluation: res.data,
            });
          } catch (e) {
            console.warn('Could not save session:', e);
          }
          setStage('evaluation');
        })
        .catch((err: any) => {
          alert(err.response?.data?.detail || 'AI evaluation failed.');
          setStage('intro');
        })
        .finally(() => setSubmitting(false));
      return;
    }
    setAnswers(merged);
    setCurrentIndex((i) => i + 1);
    setCurrentAnswer('');
    setTimeLeft(secondsPerItem);
    setIsPaused(false);
  }, [answers, currentAnswer, currentIndex, evaluateBatch, prompts, secondsPerItem, type]);

  useEffect(() => {
    if (stage !== 'session' || isPaused || submitting) return;
    if (timeLeft <= 0) {
      goNext();
      return;
    }
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [stage, timeLeft, isPaused, submitting, goNext]);

  useEffect(() => {
    const p = prompts[currentIndex];
    if (p) setCurrentAnswer(answers[p.id] ?? '');
  }, [currentIndex, prompts, answers]);

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await PracticeService.getRandomSet(type, itemCount);
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length === 0) throw new Error('No prompts');
      setPrompts(list);
      setAnswers({});
      setCurrentIndex(0);
      setCurrentAnswer('');
      setTimeLeft(secondsPerItem);
      setIsPaused(false);
      setStage('session');
    } catch {
      alert(`No ${type} prompts found. Ask admin to run: python manage.py seed_wat_srt`);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStage('intro');
    setPrompts([]);
    setEvaluation(null);
    setCurrentIndex(0);
    setAnswers({});
    setCurrentAnswer('');
  };

  const current = prompts[currentIndex];  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">{title}</h1>
          <p className="text-text-secondary text-sm">{subtitle}</p>
        </div>
        {stage === 'session' && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className={cn(
                'px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all',
                isPaused ? 'bg-secondary-fixed text-primary' : 'bg-white border border-navy-200 text-on-surface-variant hover:bg-surface-container-low'
              )}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <TimerProgress time={timeLeft} maxTime={secondsPerItem} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-10 text-center max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-primary mb-3">Session rules</h2>
              {bankSize != null && bankSize > 0 && (
                <p className="text-sm font-bold text-accent-600 mb-4">{bankSize} prompts in your {type} bank</p>
              )}
              <ul className="text-left text-sm text-primary space-y-2 mb-8 bg-surface-container-low p-5 rounded-2xl">
                <li>• <b>{itemCount}</b> {promptLabel.toLowerCase()}s per session</li>
                <li>• <b>{secondsPerItem} seconds</b> per response</li>
                <li>• AI reviews all answers at the end</li>
              </ul>
              <button
                type="button"
                onClick={startSession}
                disabled={loading}
                className="bg-primary text-white px-10 py-3 rounded-2xl font-bold inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Start {type}
              </button>
            </Card>
          </motion.div>
        )}

        {stage === 'session' && current && !submitting && (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-outline uppercase tracking-wide">
                Active Session
              </span>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {currentIndex + 1} / {prompts.length}
              </span>
            </div>

            <Card className="p-8 mb-4 border border-outline-variant/30">
              {type === 'WAT' ? (
                <div className="space-y-6">
                  <div className="text-center py-10 bg-surface-container-low/50 rounded-2xl border border-dashed border-outline-variant/30">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Stimulus Word</p>
                    <p className="text-4xl font-sans font-extrabold text-primary uppercase tracking-wide text-glow">
                      {current.text}
                    </p>
                  </div>
                  <input
                    key={currentIndex}
                    autoFocus
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={answerPlaceholder}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 text-center text-sm font-semibold focus:ring-2 focus:ring-accent-400 outline-none"
                    disabled={isPaused}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        goNext();
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-secondary-fixed/10/70 border-l-4 border-secondary-fixed p-4 rounded-r-xl">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Situation Scenario</p>
                    <p className="text-base font-bold text-primary leading-relaxed">{current.text}</p>
                  </div>
                  <textarea
                    key={currentIndex}
                    autoFocus
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={answerPlaceholder}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-accent-400 resize-none outline-none"
                    disabled={isPaused}
                  />
                </div>
              )}
            </Card>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={goNext}
                className="bg-primary hover:bg-primary-container text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                {currentIndex + 1 === prompts.length ? 'Finish & Evaluate' : 'Next Word →'}
              </button>
            </div>
          </motion.div>
        )}

        {submitting && (
          <div className="flex flex-col items-center py-20 text-text-secondary">
            <Loader2 className="animate-spin mb-3 text-secondary-fixed" size={36} />
            <p className="font-bold text-primary text-sm">Evaluating Responses...</p>
            <p className="text-xs text-outline mt-1">Our AI Mentor is assessing psychological indicators</p>
          </div>
        )}

        {stage === 'evaluation' && evaluation && (
          <motion.div key="eval" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-primary text-white rounded-3xl p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <span className="bg-secondary-fixed text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                  Psychology Report Ready
                </span>
                <h2 className="text-2xl font-display font-bold mb-2">{type} Assessment Result</h2>
                <p className="text-outline-variant text-sm">
                  Review how your responses align with recommended Officer-Like Qualities.
                </p>
              </div>
              <div className="relative flex items-center justify-center w-20 h-20 bg-white/5 rounded-full border-4 border-secondary-fixed shrink-0 shadow-lg">
                <div className="text-center">
                  <span className="text-xl font-practice-word text-white text-glow block">
                    {evaluation.overall_score || 75}
                  </span>
                  <span className="text-[8px] text-outline-variant font-bold uppercase">Rating</span>
                </div>
              </div>
            </div>

            {/* Sub Stats */}
            {type === 'WAT' && evaluation.positive_count !== undefined && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 flex items-center justify-between border border-outline-variant/30 bg-white shadow-sm">
                  <div>
                    <p className="text-xs text-text-secondary font-medium">Spontaneous Positive Sentences</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {evaluation.positive_count} / {itemCount}
                    </p>
                  </div>
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                    Active Positive
                  </span>
                </Card>
                <Card className="p-4 flex items-center justify-between border border-outline-variant/30 bg-white shadow-sm">
                  <div>
                    <p className="text-xs text-text-secondary font-medium">OLQ Alignment Ratio</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {Math.round((evaluation.positive_count / itemCount) * 100)}%
                    </p>
                  </div>
                  <span className="bg-secondary-fixed/10 text-on-secondary-container text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                    Aligned
                  </span>
                </Card>
              </div>
            )}

            {type === 'SRT' && evaluation.olq_highlights && (
              <Card className="p-6 border border-outline-variant/30">
                <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide">OLQ Attribute Levels</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(evaluation.olq_highlights).map(([key, val]: any) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-on-surface-variant capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-bold text-secondary">{val}%</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary-fixed rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {evaluation.feedback && (
              <Card className="p-6 border border-outline-variant/30">
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Info size={16} className="text-outline" /> AI Coach Assessment
                </h3>
                <p className="text-sm text-primary leading-relaxed whitespace-pre-line bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/30">
                  {evaluation.feedback}
                </p>
              </Card>
            )}

            {/* WAT Tips or SRT Improvements */}
            {type === 'WAT' && Array.isArray(evaluation.tips) && evaluation.tips.length > 0 && (
              <Card className="p-6 border border-outline-variant/30">
                <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide">Psychologist Tips</h3>
                <ul className="space-y-2.5">
                  {evaluation.tips.map((tip: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-sm text-primary">
                      <span className="text-secondary-fixed font-bold">#{idx + 1}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {type === 'SRT' && Array.isArray(evaluation.sample_improvements) && evaluation.sample_improvements.length > 0 && (
              <Card className="p-6 border border-outline-variant/30">
                <h3 className="font-bold text-primary mb-3 text-sm uppercase tracking-wide">Recommended Actions</h3>
                <div className="space-y-3">
                  {evaluation.sample_improvements.map((action: string, idx: number) => (
                    <div key={idx} className="bg-secondary-fixed/10/40 border border-secondary-fixed/30 p-3 rounded-xl text-xs text-primary leading-relaxed italic">
                      &ldquo;{action}&rdquo;
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Item-wise review table */}
            {Array.isArray(evaluation.item_feedback) && evaluation.item_feedback.length > 0 && (
              <Card className="p-6 border border-outline-variant/30 overflow-hidden">
                <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide">Item-Wise Review</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-xs text-outline font-bold uppercase">
                        <th className="py-3 px-2 w-1/4">{promptLabel}</th>
                        <th className="py-3 px-2 w-1/2">Your Response</th>
                        <th className="py-3 px-2 w-1/4 text-center">Sentiment / OLQ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {evaluation.item_feedback.map((item: any, idx: number) => {
                        const rating = (item.rating || 'neutral').toLowerCase();
                        let badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                        let badgeText = "Neutral";
                        if (rating.includes('positive') || rating.includes('excellent') || rating.includes('high')) {
                          badgeClass = "bg-green-50 text-green-700 border-green-100";
                          badgeText = "OLQ Aligned";
                        } else if (rating.includes('negative') || rating.includes('needs work') || rating.includes('low')) {
                          badgeClass = "bg-red-50 text-red-700 border-red-100";
                          badgeText = "Needs Work";
                        }

                        return (
                          <tr key={idx} className="text-sm hover:bg-surface-container-low/40 transition-colors">
                            <td className="py-3.5 px-2 font-bold text-primary uppercase tracking-wide">
                              {item.prompt}
                            </td>
                            <td className="py-3.5 px-2 text-primary">
                              <p className="font-medium">{item.response}</p>
                              {item.comment && (
                                <p className="text-xs text-outline mt-1 italic leading-relaxed">
                                  Coach: {item.comment}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <span className={cn(
                                "inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                                badgeClass
                              )}>
                                {badgeText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={resetAll}
                className="flex-1 bg-primary hover:bg-primary-container text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-navy-950/15"
              >
                <RotateCcw size={16} /> Start New Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimedPromptPractice;
