// kartoverlay/src/lib/timer.ts
// Definitive timer logic — matches the Python video generator exactly.
// All times in milliseconds internally.

export interface LapRaw {
  lap: number;
  lapTime: number; // seconds, 3 decimal places
}

export interface Lap {
  num: number;
  lapMs: number;
  cumMs: number;
}

export interface HudState {
  lapNum: number;
  lapElapsedMs: number;  // elapsed within current lap (resets each lap)
  totalMs: number;       // total session elapsed
  bestMs: number | null; // best completed lap, null during lap 1
  sessionDone: boolean;
}

export function buildLaps(raw: LapRaw[]): Lap[] {
  let cumMs = 0;
  return raw.map((r) => {
    const lapMs = Math.round(r.lapTime * 1000);
    cumMs += lapMs;
    return { num: r.lap, lapMs, cumMs };
  });
}

export function getLapIdx(laps: Lap[], totalMs: number): number {
  let completed = 0;
  for (const lap of laps) {
    if (totalMs >= lap.cumMs) completed++;
    else break;
  }
  return Math.min(completed, laps.length - 1);
}

export function lapStartMs(laps: Lap[], idx: number): number {
  return idx === 0 ? 0 : laps[idx - 1].cumMs;
}

export function bestBefore(laps: Lap[], currentIdx: number): number | null {
  if (currentIdx === 0) return null;
  let best = Infinity;
  for (let i = 0; i < currentIdx; i++) {
    if (laps[i].lapMs < best) best = laps[i].lapMs;
  }
  return isFinite(best) ? best : null;
}

export function bestAll(laps: Lap[]): number {
  return Math.min(...laps.map((l) => l.lapMs));
}

export function getHudState(laps: Lap[], totalMs: number): HudState {
  const sessionEnd = laps[laps.length - 1].cumMs;

  if (totalMs >= sessionEnd) {
    const last = laps[laps.length - 1];
    return {
      lapNum: last.num,
      lapElapsedMs: last.lapMs,
      totalMs: last.cumMs,
      bestMs: bestAll(laps),
      sessionDone: true,
    };
  }

  const idx = getLapIdx(laps, totalMs);
  const lapElapsedMs = Math.max(0, totalMs - lapStartMs(laps, idx));
  const bestMs = bestBefore(laps, idx);

  return {
    lapNum: laps[idx].num,
    lapElapsedMs,
    totalMs,
    bestMs,
    sessionDone: false,
  };
}

// Formatting helpers

export function formatLapTime(ms: number): { secs: string; frac: string } {
  // ss.mmm — seconds always 2 digits, no minutes prefix
  const s = Math.floor(ms / 1000);
  const m = Math.floor(ms % 1000);
  return {
    secs: String(s).padStart(2, '0'),
    frac: '.' + String(m).padStart(3, '0'),
  };
}

export function formatTotalTime(ms: number): string {
  // m:ss.mmm
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
