import { useState, useRef, useCallback, useEffect } from 'react';

import {

  TrackPoint,

  routeDistance,

  bearing,

  bearingToDirection,

  formatPace,

  formatSpeedKmh,

  haversine,

  SSB_RUN_TARGET_KM,

} from '../lib/geo';

import { FitnessService } from '../services/api';



export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';



export interface SavedRun {

  id: string | number;

  startedAt: string;

  endedAt: string;

  distanceM: number;

  durationSec: number;

  avgPace: string;

  points: TrackPoint[];

}



const MIN_STEP_M = 4;

const MAX_ACCURACY_M = 60;

const RUNS_STORAGE_KEY = 'ssb_connect_runs';



function loadLocalRuns(): SavedRun[] {

  try {

    const raw = localStorage.getItem(RUNS_STORAGE_KEY);

    return raw ? JSON.parse(raw) : [];

  } catch {

    return [];

  }

}



function saveLocalRuns(runs: SavedRun[]) {

  localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(runs.slice(0, 30)));

}



function apiRunToSaved(run: {

  id: number;

  started_at: string;

  ended_at: string;

  distance_m: number;

  duration_sec: number;

  avg_pace: string;

  route_points: TrackPoint[];

}): SavedRun {

  return {

    id: run.id,

    startedAt: run.started_at,

    endedAt: run.ended_at,

    distanceM: run.distance_m,

    durationSec: run.duration_sec,

    avgPace: run.avg_pace,

    points: run.route_points ?? [],

  };

}



export function useRunTracker() {

  const [status, setStatus] = useState<RunStatus>('idle');

  const [points, setPoints] = useState<TrackPoint[]>([]);

  const [elapsedSec, setElapsedSec] = useState(0);

  const [heading, setHeading] = useState(0);

  const [direction, setDirection] = useState('N');

  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<SavedRun[]>([]);

  const [historyLoading, setHistoryLoading] = useState(true);



  const watchIdRef = useRef<number | null>(null);

  const timerRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);

  const pausedElapsedRef = useRef(0);

  const pointsRef = useRef<TrackPoint[]>([]);



  const distanceM = routeDistance(points);

  const pace = formatPace(distanceM, elapsedSec);

  const speedKmh = formatSpeedKmh(distanceM, elapsedSec);

  const progressPct = Math.min(100, (distanceM / 1000 / SSB_RUN_TARGET_KM) * 100);



  const refreshHistory = useCallback(async () => {

    setHistoryLoading(true);

    try {

      const res = await FitnessService.listRuns();

      const data = res.data.results ?? res.data;

      const serverRuns: SavedRun[] = Array.isArray(data) ? data.map(apiRunToSaved) : [];

      setHistory(serverRuns);

      saveLocalRuns(serverRuns);

    } catch {

      setHistory(loadLocalRuns());

    } finally {

      setHistoryLoading(false);

    }

  }, []);



  useEffect(() => {

    refreshHistory();

  }, [refreshHistory]);



  const stopWatch = useCallback(() => {

    if (watchIdRef.current != null) {

      navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current = null;

    }

  }, []);



  const stopTimer = useCallback(() => {

    if (timerRef.current != null) {

      window.clearInterval(timerRef.current);

      timerRef.current = null;

    }

  }, []);



  const addPoint = useCallback((lat: number, lng: number, accuracy: number, geoHeading: number | null) => {

    if (accuracy > MAX_ACCURACY_M) return;



    const pt: TrackPoint = { lat, lng, timestamp: Date.now(), accuracy };

    const prev = pointsRef.current;

    const last = prev[prev.length - 1];



    if (last && haversine(last, pt) < MIN_STEP_M) {

      if (geoHeading != null && !Number.isNaN(geoHeading)) {

        setHeading(geoHeading);

        setDirection(bearingToDirection(geoHeading));

      }

      return;

    }



    if (last) {

      const b = bearing(last, pt);

      setHeading(b);

      setDirection(bearingToDirection(b));

    } else if (geoHeading != null && !Number.isNaN(geoHeading)) {

      setHeading(geoHeading);

      setDirection(bearingToDirection(geoHeading));

    }



    const next = [...prev, pt];

    pointsRef.current = next;

    setPoints(next);

  }, []);



  const startTimer = useCallback(() => {

    startTimeRef.current = Date.now();

    stopTimer();

    timerRef.current = window.setInterval(() => {

      setElapsedSec(pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000));

    }, 1000);

  }, [stopTimer]);



  const startGps = useCallback(() => {

    if (!navigator.geolocation) {

      setError('GPS is not supported on this device.');

      return;

    }



    watchIdRef.current = navigator.geolocation.watchPosition(

      (pos) => {

        addPoint(

          pos.coords.latitude,

          pos.coords.longitude,

          pos.coords.accuracy,

          pos.coords.heading

        );

      },

      (err) => {

        setError(err.message || 'Could not access GPS. Allow location permission.');

      },

      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }

    );

  }, [addPoint]);



  const startRun = useCallback(() => {

    setError(null);

    setPoints([]);

    pointsRef.current = [];

    setElapsedSec(0);

    pausedElapsedRef.current = 0;

    setHeading(0);

    setDirection('N');

    setStatus('running');

    startTimer();

    startGps();

  }, [startTimer, startGps]);



  const pauseRun = useCallback(() => {

    stopWatch();

    stopTimer();

    pausedElapsedRef.current = elapsedSec;

    setStatus('paused');

  }, [stopWatch, stopTimer, elapsedSec]);



  const resumeRun = useCallback(() => {

    setStatus('running');

    startTimer();

    startGps();

  }, [startTimer, startGps]);



  const stopRun = useCallback(async () => {

    stopWatch();

    stopTimer();

    const finalElapsed =

      status === 'running' && startTimeRef.current

        ? pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000)

        : elapsedSec;

    const finalDist = routeDistance(pointsRef.current);



    if (pointsRef.current.length >= 2 && finalDist > 10) {

      const startedAt = new Date(pointsRef.current[0].timestamp).toISOString();

      const endedAt = new Date().toISOString();

      const payload = {

        started_at: startedAt,

        ended_at: endedAt,

        distance_m: finalDist,

        duration_sec: finalElapsed,

        avg_pace: formatPace(finalDist, finalElapsed),

        route_points: pointsRef.current,

      };



      try {

        await FitnessService.createRun(payload);

        await refreshHistory();

      } catch {

        const fallback: SavedRun = {

          id: crypto.randomUUID(),

          startedAt,

          endedAt,

          distanceM: finalDist,

          durationSec: finalElapsed,

          avgPace: payload.avg_pace,

          points: pointsRef.current,

        };

        const local = [fallback, ...loadLocalRuns()];

        saveLocalRuns(local);

        setHistory(local);

      }

    }



    setElapsedSec(finalElapsed);

    setStatus('finished');

  }, [stopWatch, stopTimer, elapsedSec, status, refreshHistory]);



  const resetRun = useCallback(() => {

    stopWatch();

    stopTimer();

    setPoints([]);

    pointsRef.current = [];

    setElapsedSec(0);

    pausedElapsedRef.current = 0;

    setStatus('idle');

    setError(null);

  }, [stopWatch, stopTimer]);



  useEffect(() => () => {

    stopWatch();

    stopTimer();

  }, [stopWatch, stopTimer]);



  return {

    status,

    points,

    distanceM,

    elapsedSec,

    heading,

    direction,

    pace,

    speedKmh,

    progressPct,

    targetKm: SSB_RUN_TARGET_KM,

    error,

    history,

    historyLoading,

    startRun,

    pauseRun,

    resumeRun,

    stopRun,

    resetRun,

    refreshHistory,

  };

}


