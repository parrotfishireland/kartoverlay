'use client';
// src/app/create/page.tsx

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import ScreenshotUpload from '@/components/ScreenshotUpload';
import HudPreview from '@/components/HudPreview';
import { buildLaps, LapRaw, Lap } from '@/lib/timer';

import { HudConfig, DEFAULT_CONFIG } from '@/lib/hudConfig';

type Step = 'upload' | 'extracted' | 'generating' | 'done' | 'error';


const PRESETS: { name: string; config: Partial<HudConfig> }[] = [
  { name: 'Orange', config: {} },
  {
    name: 'White',
    config: {
      borderColor: '#FFFFFF', accentBarColor: '#FFFFFF', labelColor: '#CCCCCC',
      primaryNumberColor: '#FFFFFF', fracNumberColor: '#888888',
      totalTimeColor: '#666666', bestColor: '#FFFFFF', bgColor: '#0A0A0A',
    },
  },
  {
    name: 'Red',
    config: {
      borderColor: '#FF2020', accentBarColor: '#FF2020', labelColor: '#FF4040',
      primaryNumberColor: '#FFFFFF', fracNumberColor: '#AA6666',
      totalTimeColor: '#663333', bestColor: '#FF8800', bgColor: '#080404',
    },
  },
  {
    name: 'Cyan',
    config: {
      borderColor: '#00CFCF', accentBarColor: '#00CFCF', labelColor: '#00CFCF',
      primaryNumberColor: '#FFFFFF', fracNumberColor: '#669999',
      totalTimeColor: '#336666', bestColor: '#00FFAA', bgColor: '#040808',
    },
  },
];

export default function CreatePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>('upload');
  const [lapsRaw, setLapsRaw] = useState<LapRaw[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [playing, setPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollMsg, setPollMsg] = useState('');
  const [config, setConfig] = useState<HudConfig>(DEFAULT_CONFIG);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleExtract = useCallback(async () => {
    if (files.length === 0) return;
    setExtracting(true);
    setErrorMsg('');
    try {
      const images = await Promise.all(
        files.map((f) => new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = () => rej(new Error('File read failed'));
          r.readAsDataURL(f);
        }))
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

  const handleGenerate = useCallback(async () => {
    if (lapsRaw.length === 0) return;
    setStep('generating');
    setPollMsg('Starting render…');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laps: lapsRaw, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      const id: string = data.jobId;
      setJobId(id);
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += 3;
        setPollMsg(`Rendering… ${elapsed}s`);
        try {
          const statusRes = await fetch(`/api/jobs/status?jobId=${id}`);
          const status = await statusRes.json();
          if (status.status === 'done') {
            if (pollRef.current) clearInterval(pollRef.current);
            const a = document.createElement('a');
            a.href = status.url;
            a.download = 'kart_overlay.mp4';
            a.click();
            setStep('done');
            fetch(`/api/jobs/cleanup?jobId=${id}`, { method: 'DELETE' }).catch(() => {});
          } else if (status.status === 'error') {
            if (pollRef.current) clearInterval(pollRef.current);
            throw new Error('Render failed on server');
          }
        } catch (pollErr) {
          if (pollRef.current) clearInterval(pollRef.current);
          setErrorMsg(pollErr instanceof Error ? pollErr.message : 'Polling error');
          setStep('error');
        }
      }, 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error starting job');
      setStep('error');
    }
  }, [lapsRaw, config]);

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFiles([]); setStep('upload'); setLapsRaw([]); setLaps([]);
    setPlaying(false); setErrorMsg(''); setJobId(null); setPollMsg('');
  };

  const applyPreset = (preset: Partial<HudConfig>) => {
    setConfig({ ...DEFAULT_CONFIG, ...preset });
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
                {extracting ? 'Reading lap times…' : `Extract Laps from ${files.length} Screenshot${files.length > 1 ? 's' : ''}`}
              </button>
            )}
          </section>

          {['extracted', 'generating', 'done'].includes(step) && (
            <section style={s.section}>
              <SectionHeader n="02" title={`${lapsRaw.length} laps · ${sessionMins}:${sessionSecs}`} />
              <LapTable laps={laps} />
            </section>
          )}

          {/* ── Customise section ── always visible after extract ── */}
          {['extracted', 'generating', 'done'].includes(step) && (
            <section style={s.section}>
              <SectionHeader n="03" title="Customise HUD" />
              <CustomisePanel config={config} onChange={setConfig} onPreset={applyPreset} />
              {step === 'extracted' && (
                <button style={s.btnPrimary} onClick={handleGenerate}>
                  Generate Video →
                </button>
              )}
            </section>
          )}

          {step === 'generating' && (
            <section style={s.section}>
              <SectionHeader n="04" title="Generating Video" />
              <div style={s.spinnerWrap}><div style={s.spinner} /></div>
              <p style={s.genMsg}>{pollMsg}</p>
              <p style={s.genNote}>Play the preview while you wait — download starts automatically when ready.</p>
            </section>
          )}

          {step === 'done' && (
            <section style={s.section}>
              <SectionHeader n="04" title="Download Started ✓" />
              <div style={s.compositeNote}>
                <strong style={{ color: '#ffaa00' }}>In Premiere / DaVinci Resolve:</strong><br />
                Import → blend mode <strong>Screen</strong> → black drops out.<br />
                Use the lap number incrementing as your sync marker.
              </div>
              {jobId && (
                <a href={`/api/jobs/download?jobId=${jobId}`} download="kart_overlay.mp4" style={s.btnDownload}>
                  Re-download
                </a>
              )}
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

        {/* ── Right panel ── */}
        <div style={s.right}>
          <div style={s.previewLabel}>LIVE PREVIEW</div>
          <HudPreview laps={laps} playing={playing} config={config} />
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

// ── Customise Panel ────────────────────────────────────────────────────────────

function CustomisePanel({
  config, onChange, onPreset,
}: {
  config: HudConfig;
  onChange: (c: HudConfig) => void;
  onPreset: (p: Partial<HudConfig>) => void;
}) {
  const set = (key: keyof HudConfig, value: string | number | boolean) =>
    onChange({ ...config, [key]: value });

  return (
    <div style={cp.wrap}>
      {/* Presets */}
      <div style={cp.row}>
        <span style={cp.groupLabel}>PRESETS</span>
        <div style={cp.presetRow}>
          {PRESETS.map((p) => (
            <button key={p.name} style={cp.presetBtn} onClick={() => onPreset(p.config)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={cp.divider} />

      {/* Colours */}
      <div style={cp.groupLabel}>COLOURS</div>
      <div style={cp.grid}>
        <ColorRow label="Border" value={config.borderColor} onChange={(v) => set('borderColor', v)} />
        <ColorRow label="Accent bar" value={config.accentBarColor} onChange={(v) => set('accentBarColor', v)} />
        <ColorRow label="Labels" value={config.labelColor} onChange={(v) => set('labelColor', v)} />
        <ColorRow label="Numbers" value={config.primaryNumberColor} onChange={(v) => set('primaryNumberColor', v)} />
        <ColorRow label="Fraction" value={config.fracNumberColor} onChange={(v) => set('fracNumberColor', v)} />
        <ColorRow label="Total time" value={config.totalTimeColor} onChange={(v) => set('totalTimeColor', v)} />
        <ColorRow label="Best time" value={config.bestColor} onChange={(v) => set('bestColor', v)} />
      </div>

      <div style={cp.divider} />

      {/* Background */}
      <div style={cp.groupLabel}>BACKGROUND</div>
      <div style={cp.grid}>
        <ColorRow label="BG colour" value={config.bgColor} onChange={(v) => set('bgColor', v)} />
        <div style={cp.sliderRow}>
          <span style={cp.sliderLabel}>Opacity</span>
          <input
            type="range" min={0} max={100} value={config.bgOpacity}
            onChange={(e) => set('bgOpacity', Number(e.target.value))}
            style={cp.slider}
          />
          <span style={cp.sliderVal}>{config.bgOpacity}%</span>
        </div>
      </div>

      <div style={cp.divider} />

      {/* Toggles */}
      <div style={cp.groupLabel}>ELEMENTS</div>
      <div style={cp.toggleGrid}>
        <Toggle label="Lap Number" value={config.showLapNumber} onChange={(v) => set('showLapNumber', v)} />
        <Toggle label="Lap Time" value={config.showLapTime} onChange={(v) => set('showLapTime', v)} />
        <Toggle label="Total Time" value={config.showTotal} onChange={(v) => set('showTotal', v)} />
        <Toggle label="Best Time" value={config.showBest} onChange={(v) => set('showBest', v)} />
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={cp.colorRow}>
      <span style={cp.colorLabel}>{label}</span>
      <div style={cp.colorRight}>
        <label style={{ position: 'relative', width: 28, height: 22, display: 'block', cursor: 'pointer' }}>
          <div style={{ width: 28, height: 22, borderRadius: 4, background: value, border: '1px solid rgba(255,255,255,0.15)', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
          />
        </label>
        <span style={cp.colorHex}>{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={cp.toggleRow} onClick={() => onChange(!value)}>
      <span style={cp.toggleLabel}>{label}</span>
      <div style={{ ...cp.toggleTrack, background: value ? 'rgba(255,100,0,0.4)' : 'rgba(255,255,255,0.08)', borderColor: value ? '#ff6400' : 'rgba(255,255,255,0.15)' }}>
        <div style={{ ...cp.toggleThumb, transform: value ? 'translateX(14px)' : 'translateX(0px)', background: value ? '#ff6400' : 'rgba(255,255,255,0.3)' }} />
      </div>
    </div>
  );
}

// ── Supporting components ──────────────────────────────────────────────────────

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
            <span style={{ color: '#fff' }}>{String(lapS).padStart(2, '0')}.{String(lapM).padStart(3, '0')}</span>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>{cumMins}:{cumSecs}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const cp: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,100,0,0.03)', border: '1px solid rgba(255,100,0,0.12)', borderRadius: 8, padding: '14px 16px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  groupLabel: { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,100,0,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 },
  divider: { height: 1, background: 'rgba(255,100,0,0.08)', margin: '4px 0' },
  presetRow: { display: 'flex', gap: 6 },
  presetBtn: { background: 'rgba(255,100,0,0.1)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,100,0,0.2)', borderRadius: 4, padding: '4px 10px', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' },
  grid: { display: 'flex', flexDirection: 'column', gap: 6 },
  colorRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  colorLabel: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  colorRight: { display: 'flex', alignItems: 'center', gap: 6 },
  colorSwatch: { width: 16, height: 16, borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' },
  colorInput: { width: 28, height: 22, border: 'none', padding: 0, background: 'none', cursor: 'pointer', borderRadius: 3 },
  colorHex: { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 56 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 8 },
  sliderLabel: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1 },
  slider: { flex: 2, accentColor: '#ff6400' },
  sliderVal: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 32, textAlign: 'right' },
  toggleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' },
  toggleLabel: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  toggleTrack: { width: 32, height: 18, borderRadius: 9, border: '1px solid', display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'all 0.2s' },
  toggleThumb: { width: 12, height: 12, borderRadius: '50%', transition: 'all 0.2s' },
};

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
  btnDownload: { display: 'block', background: 'rgba(255,100,0,0.1)', color: '#ff6400', border: '1px solid rgba(255,100,0,0.3)', borderRadius: 6, padding: '11px 24px', fontFamily: '"Rajdhani", Arial, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.05em', cursor: 'pointer', width: '100%', textAlign: 'center', textDecoration: 'none' },
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
