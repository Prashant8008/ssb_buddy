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

  const current = prompts[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">{title}</h1>
          <p className="text-navy-500 text-sm">{subtitle}</p>
        </div>
        {stage === 'session' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className={cn(
                'px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1',
                isPaused ? 'bg-gold-500 text-navy-900' : 'bg-white border border-navy-200'
              )}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <div className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold flex items-center gap-2">
              <Timer size={18} />
              {formatTime(timeLeft)}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-10 text-center max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Session rules</h2>
              {bankSize != null && bankSize > 0 && (
                <p className="text-sm font-bold text-army-600 mb-4">{bankSize} prompts in your {type} bank</p>
              )}
              <ul className="text-left text-sm text-navy-700 space-y-2 mb-8 bg-navy-50 p-5 rounded-2xl">
                <li>• <b>{itemCount}</b> {promptLabel.toLowerCase()}s per session</li>
                <li>• <b>{secondsPerItem} seconds</b> per response</li>
                <li>• AI reviews all answers at the end</li>
              </ul>
              <button
                type="button"
                onClick={startSession}
                disabled={loading}
                className="bg-navy-900 text-white px-10 py-3 rounded-2xl font-bold inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Start {type}
              </button>
            </Card>
          </motion.div>
        )}

        {stage === 'session' && current && !submitting && (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs font-bold text-navy-400 mb-2 uppercase">
              {currentIndex + 1} / {prompts.length}
            </p>
            <Card className="p-8 mb-4">
              <p className="text-[10px] font-bold text-gold-600 uppercase mb-2">{promptLabel}</p>
              <p className="text-2xl font-display font-bold text-navy-900 mb-6">{current.text}</p>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={answerPlaceholder}
                className="w-full bg-navy-50 border-none rounded-xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-gold-500 resize-none"
                disabled={isPaused}
              />
            </Card>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={goNext}
                className="text-sm font-bold text-gold-600 hover:underline"
              >
                Skip / Next →
              </button>
            </div>
          </motion.div>
        )}

        {submitting && (
          <div className="flex flex-col items-center py-20 text-navy-500">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="font-medium">AI is reviewing your {type} responses...</p>
          </div>
        )}

        {stage === 'evaluation' && evaluation && (
          <motion.div key="eval" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="p-6 bg-navy-900 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Award className="text-gold-400" />
                <h2 className="text-xl font-bold">{type} Evaluation Complete</h2>
              </div>
              {evaluation.overall_score != null && (
                <p className="text-3xl font-bold text-gold-400">{evaluation.overall_score}%</p>
              )}
            </Card>

            {evaluation.feedback && (
              <Card className="p-6">
                <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
                  <Info size={18} /> Overall feedback
                </h3>
                <p className="text-sm text-navy-700 whitespace-pre-line">{evaluation.feedback}</p>
              </Card>
            )}

            {Array.isArray(evaluation.item_feedback) && evaluation.item_feedback.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-navy-900 mb-4">Item-wise review</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {evaluation.item_feedback.map((item: any, idx: number) => (
                    <div key={idx} className="bg-navy-50 p-3 rounded-xl text-sm">
                      <p className="font-bold text-navy-900">{item.prompt}</p>
                      <p className="text-navy-600 mt-1">{item.response}</p>
                      {item.comment && <p className="text-navy-500 mt-2 text-xs">{item.comment}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <button
              type="button"
              onClick={resetAll}
              className="w-full bg-navy-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> New session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimedPromptPractice;
