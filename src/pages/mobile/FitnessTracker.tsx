import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Navigation,
  Trophy,
  Play,
  Pause,
  Square,
  Compass,
  Timer,
  Route,
  Gauge,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { formatDistance, formatDuration, SSB_RUN_TARGET_KM } from '../../lib/geo';
import { useRunTracker } from '../../hooks/useRunTracker';
import RunMap from '../../components/fitness/RunMap';

const FitnessTracker = () => {
  const tracker = useRunTracker();
  const [showHistory, setShowHistory] = useState(false);
  const isActive = tracker.status === 'running' || tracker.status === 'paused';

  if (isActive || tracker.status === 'finished') {
    return (
      <RunSession
        tracker={tracker}
        onDone={() => tracker.resetRun()}
      />
    );
  }

  const lastRun = tracker.history[0];

  return (
    <div className="p-4 space-y-6 pb-24 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Fitness Hub</h2>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-xs font-bold text-secondary"
        >
          {showHistory ? 'HIDE' : 'HISTORY'}
        </button>
      </div>

      {/* SSB 2.4km target */}
      <Card className="p-5 border-2 border-secondary-fixed bg-secondary-fixed/10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">SSB Target Standard</p>
          <Route size={18} className="text-secondary-fixed" />
        </div>
        <h3 className="text-2xl font-bold text-primary">{SSB_RUN_TARGET_KM} km in under 7 mins</h3>
        <p className="text-xs text-text-secondary mt-1">Enable location services for high-fidelity run diagnostics.</p>
        {lastRun && (
          <p className="text-xs text-secondary mt-3 font-semibold">
            Last run: {formatDistance(lastRun.distanceM)} · {lastRun.avgPace} /km · {formatDuration(lastRun.durationSec)}
          </p>
        )}
      </Card>

      <div className="flex flex-col items-center justify-center py-6 bg-white rounded-3xl border border-outline-variant/30 p-6 shadow-sm">
        <p className="text-xs font-bold text-outline uppercase tracking-wider mb-4 font-sans">Enlist Session</p>
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(12);
            tracker.startRun();
          }}
          className="w-20 h-20 bg-primary hover:bg-primary-container text-white rounded-full flex flex-col items-center justify-center border-4 border-secondary-fixed shadow-xl transition-all hover:scale-105 active:scale-95 text-glow relative group"
        >
          <Play size={24} fill="#ffe08f" className="text-secondary-fixed translate-x-0.5" />
          <span className="text-[9px] font-bold text-secondary-fixed-dim mt-1 uppercase tracking-wider font-sans">Start</span>
        </button>
        <p className="text-[10px] text-outline mt-4 font-medium">GPS location coordinates are verified in real time</p>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Card className="p-4">
              <h4 className="font-bold text-primary mb-3">Recent Runs</h4>
              {tracker.history.length === 0 ? (
                <p className="text-sm text-text-secondary">No runs recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tracker.history.map((run) => (
                    <div key={run.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-primary">{formatDistance(run.distanceM)}</p>
                        <p className="text-xs text-text-secondary">
                          {new Date(run.startedAt).toLocaleDateString()} · {formatDuration(run.durationSec)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-secondary">{run.avgPace}/km</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-primary flex items-center gap-2">
            <Trophy size={18} className="text-secondary-fixed" /> Tips
          </h4>
        </div>
        <ul className="text-xs text-on-surface-variant space-y-2">
          <li>• Allow location access when prompted for accurate GPS tracking</li>
          <li>• Run outdoors for best signal; map follows your direction in real time</li>
          <li>• SSB 2.4km run target — aim for steady pace under 13 min/km</li>
        </ul>
      </Card>
    </div>
  );
};

const RunSession = ({
  tracker,
  onDone,
}: {
  tracker: ReturnType<typeof useRunTracker>;
  onDone: () => void;
}) => {
  const [statsExpanded, setStatsExpanded] = useState(true);
  const finished = tracker.status === 'finished';

  return (
    <div className="fixed inset-0 top-16 z-30 flex flex-col bg-primary md:relative md:top-0 md:min-h-[calc(100vh-4rem)]">
      {/* Map */}
      <div className="flex-1 relative min-h-[50vh]">
        {tracker.error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low p-6 text-center">
            <AlertCircle className="text-red-500 mb-3" size={40} />
            <p className="text-sm text-primary font-medium">{tracker.error}</p>
            <button type="button" onClick={onDone} className="mt-4 text-sm font-bold text-secondary">
              Go back
            </button>
          </div>
        ) : (
          <RunMap
            points={tracker.points}
            heading={tracker.heading}
            distanceM={tracker.distanceM}
            followUser={tracker.status === 'running'}
            showDistanceOverlay={!finished}
          />
        )}

        {/* Direction compass overlay */}
        {!finished && tracker.points.length > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-3 shadow-lg text-center min-w-[72px]">
            <Compass
              size={28}
              className="mx-auto text-primary transition-transform duration-300"
              style={{ transform: `rotate(${tracker.heading}deg)` }}
            />
            <p className="text-lg font-bold text-primary mt-1">{tracker.direction}</p>
            <p className="text-[10px] text-text-secondary">{Math.round(tracker.heading)}°</p>
          </div>
        )}

        {/* Progress to 2.4km */}
        {!finished && (
          <div className="absolute top-4 left-4 right-24 bg-white/95 backdrop-blur rounded-2xl px-4 py-2 shadow-lg">
            <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-1">
              <span>{SSB_RUN_TARGET_KM}km target</span>
              <span>{Math.round(tracker.progressPct)}%</span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 transition-all duration-500"
                style={{ width: `${tracker.progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats panel */}
      {finished ? (
        <div className="bg-white rounded-t-3xl shadow-2xl -mt-4 relative z-10 px-6 py-8 text-center border-t border-outline-variant/30">
          <Activity className="mx-auto text-green-600 mb-2 animate-bounce" size={40} />
          <h3 className="text-xl font-bold text-primary font-display">Run Session Complete</h3>
          <p className="text-3xl font-display font-bold text-primary mt-2">
            {formatDistance(tracker.distanceM)}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {formatDuration(tracker.elapsedSec)} · {tracker.pace}/km avg pace
          </p>
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              onDone();
            }}
            className="mt-6 w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw size={18} /> Done & Save Run
          </button>
        </div>
      ) : (
        <div className="glass-dark border-t border-white/10 rounded-t-[24px] shadow-2xl -mt-6 relative z-10 p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-white text-center">
            <div className="border-r border-white/10">
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest font-sans">Distance</p>
              <p className="text-3xl font-extrabold font-practice-word text-glow mt-1 text-white">
                {formatDistance(tracker.distanceM)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest font-sans">Duration</p>
              <p className="text-3xl font-extrabold font-practice-word text-glow mt-1 text-white">
                {formatDuration(tracker.elapsedSec)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-white text-center border-t border-white/10 pt-4">
            <div className="border-r border-white/10">
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest font-sans">Current Pace</p>
              <p className="text-xl font-bold mt-1 text-secondary-fixed font-sans">{tracker.pace || '0:00'} <span className="text-xs font-normal text-outline-variant">/km</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest font-sans">Speed</p>
              <p className="text-xl font-bold mt-1 text-gold-400 font-sans">{tracker.speedKmh} <span className="text-xs font-normal text-outline-variant">km/h</span></p>
            </div>
          </div>

          {/* Action buttons with haptic touch loops */}
          <div className="flex gap-3 pt-2">
            {tracker.status === 'running' ? (
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  tracker.pauseRun();
                }}
                className="flex-1 bg-secondary-fixed hover:bg-secondary-container text-on-secondary-fixed font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-all"
              >
                <Pause size={16} fill="currentColor" /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  tracker.resumeRun();
                }}
                className="flex-1 bg-accent-500 hover:bg-accent-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-all"
              >
                <Play size={16} fill="currentColor" /> Resume
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                if (confirm('Are you sure you want to end your run session?')) {
                  tracker.stopRun();
                }
              }}
              className="bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-all"
            >
              <Square size={14} fill="currentColor" /> Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatPill = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="text-center p-2">
    <div className="flex items-center justify-center gap-1 text-outline mb-1">{icon}</div>
    <p className="text-[10px] font-bold text-outline uppercase">{label}</p>
    <p className="text-sm font-bold text-primary leading-tight">
      {value}
      {sub && <span className="text-[10px] text-outline font-medium">{sub}</span>}
    </p>
  </div>
);

export default FitnessTracker;
