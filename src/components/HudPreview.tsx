'use client';
// src/components/HudPreview.tsx

import { useEffect, useRef, useState } from 'react';
import { Lap, getHudState, formatLapTime, formatTotalTime } from '@/lib/timer';
import { HudConfig, DEFAULT_CONFIG } from '@/app/create/page';

interface HudPreviewProps {
  laps: Lap[];
  playing: boolean;
  onTimeUpdate?: (ms: number) => void;
  config?: HudConfig;
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

export default function HudPreview({ laps, playing, onTimeUpdate, config = DEFAULT_CONFIG }: HudPreviewProps) {
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
      if (sim < sessionEnd + 500) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, laps]);

  useEffect(() => {
    setTotalMs(0);
    startWallRef.current = null;
  }, [laps]);

  if (laps.length === 0) {
    return (
      <div style={{ width: 260, height: 340, background: 'rgb(8,6,4)', border: '3px solid rgba(255,100,0,0.45)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,100,0,0.35)', fontSize: 13, fontFamily: 'monospace', textAlign: 'center', padding: '0 20px' }}>HUD preview will appear here</span>
      </div>
    );
  }

  const hud = getHudState(laps, totalMs);
  const lapFmt = formatLapTime(hud.lapElapsedMs);
  const totalFmt = formatTotalTime(hud.totalMs);
  const bestFmt = hud.bestMs !== null ? formatLapTime(hud.bestMs) : null;

  const bgRgba = hexToRgba(config.bgColor, config.bgOpacity);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <div style={{ background: 'rgb(8,6,4)', padding: '40px 60px', borderRadius: 4 }}>
        <div style={{
          width: 260,
          background: bgRgba,
          border: `3px solid ${config.borderColor}`,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: `0 0 24px ${config.borderColor}26`,
        }}>
          {/* Accent bar */}
          <div style={{ height: 5, background: config.accentBarColor }} />

          <div style={{ padding: '16px 20px 18px' }}>

            {/* LAP NUMBER */}
            {config.showLapNumber && (
              <>
                <div style={labelStyle(config.labelColor)}>LAP</div>
                <div style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700, fontSize: 72, color: config.primaryNumberColor, lineHeight: 1, marginBottom: 10, letterSpacing: '-0.02em' }}>
                  {hud.lapNum}
                </div>
              </>
            )}

            {/* Divider */}
            {config.showLapTime && (
              <div style={{ height: 1, background: 'rgba(255,100,0,0.18)', marginBottom: 10 }} />
            )}

            {/* LAP TIME */}
            {config.showLapTime && (
              <>
                <div style={labelStyle(config.labelColor)}>LAP TIME</div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700, fontSize: 52, color: config.primaryNumberColor, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {lapFmt.secs}
                  </span>
                  <span style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700, fontSize: 38, color: config.fracNumberColor, lineHeight: 1, marginLeft: 1 }}>
                    {lapFmt.frac}
                  </span>
                </div>
              </>
            )}

            {/* TOTAL */}
            {config.showTotal && (
              <>
                <div style={{ ...labelStyle(config.labelColor), color: config.labelColor, opacity: 0.6 }}>TOTAL</div>
                <div style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700, fontSize: 27, color: config.totalTimeColor, marginBottom: 4 }}>
                  {totalFmt}
                </div>
              </>
            )}

            {/* Divider before best */}
            {config.showBest && (
              <div style={{ height: 1, background: 'rgba(255,100,0,0.12)', margin: '8px 0' }} />
            )}

            {/* BEST */}
            {config.showBest && (
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700, fontSize: 28, color: config.bestColor }}>
                  Best:{' '}
                </span>
                <span style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 700, fontSize: 28, color: config.bestColor }}>
                  {bestFmt ? `${bestFmt.secs}${bestFmt.frac}` : '—'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function labelStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'Arial, sans-serif',
    fontWeight: 700,
    fontSize: 11,
    color,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 2,
  };
}
