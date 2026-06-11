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
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-900">Fitness Hub</h2>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-xs font-bold text-gold-600"
        >
          {showHistory ? 'HIDE' : 'HISTORY'}
        </button>
      </div>

      {/* SSB 2.4km target */}
      <Card className="p-4 bg-navy-900 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-navy-400 uppercase">SSB Standard Run</p>
          <Route size={16} className="text-gold-500" />
        </div>
        <h3 className="text-2xl font-bold">{SSB_RUN_TARGET_KM} km</h3>
        <p className="text-xs text-navy-300 mt-1">GPS tracks your route, distance, pace & direction</p>
        {lastRun && (
          <p className="text-xs text-gold-400 mt-3 font-medium">
            Last run: {formatDistance(lastRun.distanceM)} · {lastRun.avgPace} /km · {formatDuration(lastRun.durationSec)}
          </p>
        )}
      </Card>

      <button
        type="button"
        onClick={tracker.startRun}
        className="w-full bg-army-600 text-white p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-lg shadow-army-600/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-army-500 rounded-full flex items-center justify-center">
            <Navigation size={24} />
          </div>
          <div className="text-left">
            <h4 className="font-bold">Start {SSB_RUN_TARGET_KM}km Run</h4>
            <p className="text-xs text-army-200">Live map · GPS route tracking</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Play size={20} fill="white" />
        </div>
      </button>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Card className="p-4">
              <h4 className="font-bold text-navy-900 mb-3">Recent Runs</h4>
              {tracker.history.length === 0 ? (
                <p className="text-sm text-navy-500">No runs recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tracker.history.map((run) => (
                    <div key={run.id} className="flex justify-between items-center p-3 bg-navy-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-navy-900">{formatDistance(run.distanceM)}</p>
                        <p className="text-xs text-navy-500">
                          {new Date(run.startedAt).toLocaleDateString()} · {formatDuration(run.durationSec)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gold-600">{run.avgPace}/km</span>
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
          <h4 className="font-bold text-navy-900 flex items-center gap-2">
            <Trophy size={18} className="text-gold-500" /> Tips
          </h4>
        </div>
        <ul className="text-xs text-navy-600 space-y-2">
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
    <div className="fixed inset-0 top-16 z-30 flex flex-col bg-navy-900 md:relative md:top-0 md:min-h-[calc(100vh-4rem)]">
      {/* Map */}
      <div className="flex-1 relative min-h-[50vh]">
        {tracker.error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-50 p-6 text-center">
            <AlertCircle className="text-red-500 mb-3" size={40} />
            <p className="text-sm text-navy-700 font-medium">{tracker.error}</p>
            <button type="button" onClick={onDone} className="mt-4 text-sm font-bold text-gold-600">
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
              className="mx-auto text-navy-900 transition-transform duration-300"
              style={{ transform: `rotate(${tracker.heading}deg)` }}
            />
            <p className="text-lg font-bold text-navy-900 mt-1">{tracker.direction}</p>
            <p className="text-[10px] text-navy-500">{Math.round(tracker.heading)}°</p>
          </div>
        )}

        {/* Progress to 2.4km */}
        {!finished && (
          <div className="absolute top-4 left-4 right-24 bg-white/95 backdrop-blur rounded-2xl px-4 py-2 shadow-lg">
            <div className="flex justify-between text-[10px] font-bold text-navy-500 mb-1">
              <span>{SSB_RUN_TARGET_KM}km target</span>
              <span>{Math.round(tracker.progressPct)}%</span>
            </div>
            <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-army-500 transition-all duration-500"
                style={{ width: `${tracker.progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats panel */}
      <div className="bg-white rounded-t-3xl shadow-2xl -mt-4 relative z-10">
        <button
          type="button"
          onClick={() => setStatsExpanded((v) => !v)}
          className="w-full flex justify-center py-2 text-navy-300"
        >
          {statsExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        {finished ? (
          <div className="px-6 pb-8 text-center">
            <Activity className="mx-auto text-green-500 mb-2" size={36} />
            <h3 className="text-xl font-bold text-navy-900">Run Complete</h3>
            <p className="text-3xl font-display font-bold text-navy-900 mt-2">
              {formatDistance(tracker.distanceM)}
            </p>
            <p className="text-sm text-navy-500 mt-1">
              {formatDuration(tracker.elapsedSec)} · {tracker.pace}/km avg pace
            </p>
            <button
              type="button"
              onClick={onDone}
              className="mt-6 w-full bg-navy-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Done
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 px-4 pb-2">
              <StatPill icon={<Route size={14} />} label="Distance" value={formatDistance(tracker.distanceM)} />
              <StatPill icon={<Timer size={14} />} label="Time" value={formatDuration(tracker.elapsedSec)} />
              <StatPill icon={<Gauge size={14} />} label="Pace" value={`${tracker.pace}`} sub="/km" />
              <StatPill icon={<Navigation size={14} />} label="Speed" value={tracker.speedKmh} sub="km/h" />
            </div>

            {statsExpanded && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                <div className="bg-navy-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-navy-400 uppercase">Direction</p>
                  <p className="text-xl font-bold text-navy-900">{tracker.direction}</p>
                </div>
                <div className="bg-navy-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-navy-400 uppercase">GPS points</p>
                  <p className="text-xl font-bold text-navy-900">{tracker.points.length}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 px-4 pb-6 pt-2">
              {tracker.status === 'running' ? (
                <button
                  type="button"
                  onClick={tracker.pauseRun}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold-500 text-navy-900 py-3.5 rounded-xl font-bold"
                >
                  <Pause size={20} /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={tracker.resumeRun}
                  className="flex-1 flex items-center justify-center gap-2 bg-army-600 text-white py-3.5 rounded-xl font-bold"
                >
                  <Play size={20} fill="white" /> Resume
                </button>
              )}
              <button
                type="button"
                onClick={tracker.stopRun}
                className="flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3.5 rounded-xl font-bold"
              >
                <Square size={18} fill="white" /> Stop
              </button>
            </div>
          </>
        )}
      </div>
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
    <div className="flex items-center justify-center gap-1 text-navy-400 mb-1">{icon}</div>
    <p className="text-[10px] font-bold text-navy-400 uppercase">{label}</p>
    <p className="text-sm font-bold text-navy-900 leading-tight">
      {value}
      {sub && <span className="text-[10px] text-navy-400 font-medium">{sub}</span>}
    </p>
  </div>
);

export default FitnessTracker;
