'use client';
// kartoverlay/src/components/HudPreview.tsx
// Live animated HUD — replicates the video generator output faithfully in the browser.

import { useEffect, useRef, useState } from 'react';
import { Lap, getHudState, formatLapTime, formatTotalTime } from '@/lib/timer';

interface HudPreviewProps {
  laps: Lap[];
  playing: boolean;
  onTimeUpdate?: (ms: number) => void;
}

export default function HudPreview({ laps, playing, onTimeUpdate }: HudPreviewProps) {
  const [totalMs, setTotalMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startWallRef = useRef<number | null>(null);
  const startSimRef = useRef<number>(0);

  const sessionEnd = laps.length > 0 ? laps[laps.length - 1].cumMs : 0;

  useEffect(() => {
    if (!playing || laps.length === 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startWallRef.current = performance.now();
    startSimRef.current = totalMs;

    function tick(now: number) {
      const elapsed = now - (startWallRef.current ?? now);
      const sim = Math.min(startSimRef.current + elapsed, sessionEnd + 500);
      setTotalMs(sim);
      onTimeUpdate?.(sim);
      if (sim < sessionEnd + 500) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, laps]);

  // Reset when laps change
  useEffect(() => {
    setTotalMs(0);
    startWallRef.current = null;
  }, [laps]);

  if (laps.length === 0) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>HUD preview will appear here</span>
      </div>
    );
  }

  const hud = getHudState(laps, totalMs);
  const lapFmt = formatLapTime(hud.lapElapsedMs);
  const totalFmt = formatTotalTime(hud.totalMs);
  const bestFmt = hud.bestMs !== null ? formatLapTime(hud.bestMs) : null;

  return (
    <div style={styles.container}>
      {/* Simulated video canvas — black bg matching the AVI output */}
      <div style={styles.videoCanvas}>
        <div style={styles.hud}>
          {/* Orange accent bar */}
          <div style={styles.accentBar} />

          <div style={styles.inner}>
            {/* LAP */}
            <div style={styles.label}>LAP</div>
            <div style={styles.lapNumber}>{hud.lapNum}</div>

            <div style={styles.divider} />

            {/* LAP TIME */}
            <div style={styles.label}>LAP TIME</div>
            <div style={styles.lapTimeRow}>
              <span style={styles.lapTimeSecs}>{lapFmt.secs}</span>
              <span style={styles.lapTimeFrac}>{lapFmt.frac}</span>
            </div>

            {/* TOTAL */}
            <div style={{ ...styles.label, color: '#a04000' }}>TOTAL</div>
            <div style={styles.totalTime}>{totalFmt}</div>

            <div style={styles.dividerFaint} />

            {/* BEST */}
            <div style={styles.bestRow}>
              <span style={styles.bestLabel}>Best: </span>
              <span style={styles.bestValue}>
                {bestFmt ? `${bestFmt.secs}${bestFmt.frac}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles replicating the Python renderer at screen scale
const HUD_W = 260;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  placeholder: {
    width: HUD_W,
    height: 340,
    background: 'rgb(8,6,4)',
    border: '3px solid rgba(255,100,0,0.45)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: 'rgba(255,100,0,0.35)',
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    padding: '0 20px',
  },
  videoCanvas: {
    background: 'rgb(8,6,4)',
    padding: '40px 60px',
    borderRadius: 4,
  },
  hud: {
    width: HUD_W,
    background: 'rgb(8,6,4)',
    border: '3px solid rgba(255,100,0,0.75)',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 0 24px rgba(255,100,0,0.15)',
  },
  accentBar: {
    height: 5,
    background: 'linear-gradient(90deg, #ff5000, #ffaa00)',
  },
  inner: {
    padding: '16px 20px 18px',
  },
  label: {
    fontFamily: 'Arial, sans-serif',
    fontWeight: 700,
    fontSize: 11,
    color: '#ff6a00',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  lapNumber: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontSize: 72,
    color: '#ffffff',
    lineHeight: 1,
    marginBottom: 10,
    letterSpacing: '-0.02em',
  },
  divider: {
    height: 1,
    background: 'rgba(255,100,0,0.18)',
    marginBottom: 10,
  },
  dividerFaint: {
    height: 1,
    background: 'rgba(255,100,0,0.12)',
    margin: '8px 0',
  },
  lapTimeRow: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  lapTimeSecs: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontSize: 52,
    color: '#ffffff',
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  lapTimeFrac: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontSize: 38,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1,
    marginLeft: 1,
  },
  totalTime: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontSize: 27,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
  bestRow: {
    display: 'flex',
    alignItems: 'baseline',
  },
  bestLabel: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontSize: 28,
    color: '#ffaa00',
  },
  bestValue: {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontSize: 28,
    color: '#ffaa00',
  },
};
