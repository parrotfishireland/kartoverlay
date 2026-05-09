'use client';
// kartoverlay/src/app/create/page.tsx
// Simplified for Modal backend: no polling, no job IDs.
// Generate fires one request; response IS the AVI bytes; browser download triggers automatically.

import { useState, useCallback } from 'react';
import Link from 'next/link';
import ScreenshotUpload from '@/components/ScreenshotUpload';
import HudPreview from '@/components/HudPreview';
import { buildLaps, LapRaw, Lap } from '@/lib/timer';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

type Step = 'upload' | 'extracted' | 'generating' | 'done' | 'error';

export default function CreatePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>('upload');
  const [lapsRaw, setLapsRaw] = useState<LapRaw[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [playing, setPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState('');

  // ── Step 1: Extract laps from screenshots ──────────────────────────────
  const handleExtract = useCallback(async () => {
    if (files.length === 0) return;
    setExtracting(true);
    setErrorMsg('');

    try {
      const images = await Promise.all(
        files.map(
          (f) =>
            new Promise<string>((res, rej) => {
              const r = new FileReader();
              r.onload = () => res(r.result as string);
              r.onerror = () => rej(new Error('File read failed'));
              r.readAsDataURL(f);
            })
        )
      );

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed');

      const raw: LapRaw[] = data.laps;
      setLapsRaw(raw);
      setLaps(buildLaps(raw));
      setStep('extracted');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error during extraction');
      setStep('error');
    } finally {
      setExtracting(false);
    }
  }, [files]);

  // ── Step 2: Generate video ──────────────────────────────────────────────
  // Modal returns AVI bytes directly. We blob → object URL → auto-download.
  const handleGenerate = useCallback(async () => {
    if (lapsRaw.length === 0) return;
    setStep('generating');

    const sessionSecs = Math.round(lapsRaw.reduce((s, l) => s + l.lapTime, 0));
    setGeneratingMsg(`Rendering ${lapsRaw.length} laps (~${sessionSecs}s of footage)…`);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_MODAL_ENDPOINT || '/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laps: lapsRaw }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kart_overlay.avi';
      a.click();
      URL.revokeObjectURL(url);

      setStep('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error generating video');
      setStep('error');
    }
  }, [lapsRaw]);

  const reset = () => {
    setFiles([]);
    setStep('upload');
    setLapsRaw([]);
    setLaps([]);
    setPlaying(false);
    setErrorMsg('');
    setGeneratingMsg('');
  };

  const sessionTotalMs = laps.length > 0 ? laps[laps.length - 1].cumMs : 0;
  const sessionMins = Math.floor(sessionTotalMs / 60000);
  const sessionSecs = ((sessionTotalMs % 60000) / 1000).toFixed(3);

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <Link href="/" style={s.navBack}>← KartOverlay</Link>
        <div style={s.navTitle}>Create Overlay</div>
      </nav>

      <div style={s.layout}>
        {/* ── Left panel ── */}
        <div style={s.left}>

          <section style={s.section}>
            <SectionHeader n="01" title="Upload Screenshots" />
            <ScreenshotUpload
              onFiles={(f) => { setFiles(f); if (step !== 'upload') setStep('upload'); }}
              disabled={extracting || step === 'generating'}
            />
            {files.length > 0 && step === 'upload' && (
              <button
                style={extracting ? s.btnDisabled : s.btnPrimary}
                onClick={handleExtract}
                disabled={extracting}
              >
                {extracting
                  ? 'Reading lap times…'
                  : `Extract Laps from ${files.length} Screenshot${files.length > 1 ? 's' : ''}`}
              </button>
            )}
          </section>

          {['extracted', 'generating', 'done'].includes(step) && (
            <section style={s.section}>
              <SectionHeader n="02" title={`${lapsRaw.length} laps · ${sessionMins}:${sessionSecs}`} />
              <LapTable laps={laps} />
              {step === 'extracted' && (
                <button style={s.btnPrimary} onClick={handleGenerate}>
                  Generate Video →
                </button>
              )}
            </section>
          )}

          {step === 'generating' && (
            <section style={s.section}>
              <SectionHeader n="03" title="Generating Video" />
              <div style={s.spinnerWrap}><div style={s.spinner} /></div>
              <p style={s.genMsg}>{generatingMsg}</p>
              <p style={s.genNote}>
                Play the preview while you wait — download starts automatically.
              </p>
            </section>
          )}

          {step === 'done' && (
            <section style={s.section}>
              <SectionHeader n="03" title="Download Started ✓" />
              <div style={s.compositeNote}>
                <strong style={{ color: '#ffaa00' }}>In Premiere / DaVinci Resolve:</strong><br />
                Import → blend mode <strong>Screen</strong> → black drops out.<br />
                Use the lap number incrementing as your sync marker.
              </div>
              <button style={s.btnSecondary} onClick={handleGenerate}>Re-download</button>
              <button style={s.btnReset} onClick={reset}>Start Over</button>
            </section>
          )}

          {step === 'error' && (
            <section style={s.section}>
              <div style={s.errorBox}>
                <strong>Something went wrong</strong>
                <p style={{ marginTop: 8 }}>{errorMsg}</p>
              </div>
              <button style={s.btnReset} onClick={reset}>Try Again</button>
            </section>
          )}
        </div>

        {/* ── Right panel: live HUD ── */}
        <div style={s.right}>
          <div style={s.previewLabel}>LIVE PREVIEW</div>
          <HudPreview laps={laps} playing={playing} />
          {laps.length > 0 && (
            <div style={s.playControls}>
              <button
                style={playing ? s.btnPause : s.btnPlay}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? '⏸ Pause' : '▶ Play Preview'}
              </button>
              <p style={s.previewNote}>Exactly what the video will look like</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#ff6400', opacity: 0.7, letterSpacing: '0.1em' }}>{n}</span>
      <span style={{ fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '0.03em' }}>{title}</span>
    </div>
  );
}

function LapTable({ laps }: { laps: Lap[] }) {
  return (
    <div style={s.lapTable}>
      <div style={s.lapHeader}><span>LAP</span><span>TIME</span><span>CUMULATIVE</span></div>
      {laps.map((lap) => {
        const cumMins = Math.floor(lap.cumMs / 60000);
        const cumSecs = ((lap.cumMs % 60000) / 1000).toFixed(3);
        const lapS = Math.floor(lap.lapMs / 1000);
        const lapM = lap.lapMs % 1000;
        return (
          <div key={lap.num} style={s.lapRow}>
            <span style={{ color: '#ff6400', fontWeight: 700 }}>{lap.num}</span>
            <span style={{ color: '#fff' }}>{String(lapS).padStart(2,'0')}.{String(lapM).padStart(3,'0')}</span>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>{cumMins}:{cumSecs}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: 'rgb(8,6,4)', color: '#fff' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,100,0,0.1)' },
  navBack: { color: 'rgba(255,100,0,0.7)', textDecoration: 'none', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.05em' },
  navTitle: { fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  layout: { display: 'flex', minHeight: 'calc(100vh - 57px)' },
  left: { flex: '0 0 460px', padding: '32px', borderRight: '1px solid rgba(255,100,0,0.1)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 },
  right: { flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'rgba(255,100,0,0.02)' },
  previewLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,100,0,0.4)', textTransform: 'uppercase', marginBottom: -8 },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  btnPrimary: { background: 'linear-gradient(135deg, #ff5000, #ff8c00)', color: '#fff', border: 'none', borderRadius: 6, padding: '13px 24px', fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em', cursor: 'pointer', width: '100%', boxShadow: '0 0 20px rgba(255,80,0,0.25)' },
  btnDisabled: { background: 'rgba(255,100,0,0.2)', color: 'rgba(255,255,255,0.4)', border: 'none', borderRadius: 6, padding: '13px 24px', fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em', cursor: 'not-allowed', width: '100%' },
  btnSecondary: { background: 'rgba(255,100,0,0.1)', color: '#ff6400', border: '1px solid rgba(255,100,0,0.3)', borderRadius: 6, padding: '11px 24px', fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.05em', cursor: 'pointer', width: '100%' },
  btnReset: { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '10px 20px', fontFamily: 'Arial, sans-serif', fontSize: 13, cursor: 'pointer', width: '100%' },
  lapTable: { fontFamily: 'monospace', fontSize: 13, background: 'rgba(255,100,0,0.04)', border: '1px solid rgba(255,100,0,0.15)', borderRadius: 6, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' },
  lapHeader: { display: 'grid', gridTemplateColumns: '50px 1fr 1fr', padding: '8px 14px', background: 'rgba(255,100,0,0.08)', color: '#ff6400', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,100,0,0.15)' },
  lapRow: { display: 'grid', gridTemplateColumns: '50px 1fr 1fr', padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  spinnerWrap: { display: 'flex', justifyContent: 'center', padding: '8px 0' },
  spinner: { width: 36, height: 36, border: '3px solid rgba(255,100,0,0.15)', borderTopColor: '#ff6400', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  genMsg: { fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 },
  genNote: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, margin: 0 },
  compositeNote: { background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 6, padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: 'Arial, sans-serif' },
  errorBox: { background: 'rgba(255,40,40,0.08)', border: '1px solid rgba(255,40,40,0.25)', borderRadius: 6, padding: '16px', fontFamily: 'Arial, sans-serif', fontSize: 14, color: 'rgba(255,150,150,0.9)', lineHeight: 1.6 },
  btnPlay: { background: 'rgba(255,100,0,0.12)', color: '#ff6400', border: '1px solid rgba(255,100,0,0.35)', borderRadius: 6, padding: '10px 24px', fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: '0.05em' },
  btnPause: { background: 'rgba(255,100,0,0.2)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.4)', borderRadius: 6, padding: '10px 24px', fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: '0.05em' },
  playControls: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  previewNote: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', margin: 0 },
};
