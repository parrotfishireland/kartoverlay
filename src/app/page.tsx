// kartoverlay/src/app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={styles.root}>
      {/* Noise texture overlay */}
      <div style={styles.noise} aria-hidden />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>KART</span>
          <span style={styles.logoMain}>OVERLAY</span>
        </div>
        <Link href="/create" style={styles.navCta}>
          Launch App →
        </Link>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroTag}>FOR KARTING FAMILIES &amp; COACHES</div>

        <h1 style={styles.heroTitle}>
          Professional lap timer
          <br />
          <span style={styles.heroTitleAccent}>overlays in minutes.</span>
        </h1>

        <p style={styles.heroSub}>
          Upload a screenshot from RaceChrono, AiM, or MyChron. Get a
          broadcast-quality animated HUD overlay video, ready to drop into
          Premiere Pro or DaVinci Resolve.
        </p>

        <div style={styles.heroCtas}>
          <Link href="/create" style={styles.primaryCta}>
            Create Your Overlay
          </Link>
          <a href="#how-it-works" style={styles.secondaryCta}>
            See how it works
          </a>
        </div>
      </section>

      {/* HUD sample — static representation */}
      <section style={styles.hudShowcase}>
        <div style={styles.hudDemo}>
          <div style={styles.hudAccentBar} />
          <div style={styles.hudInner}>
            <div style={styles.hudLabel}>LAP</div>
            <div style={styles.hudLapNum}>7</div>
            <div style={styles.hudDivider} />
            <div style={styles.hudLabel}>LAP TIME</div>
            <div style={styles.hudTimeRow}>
              <span style={styles.hudTimeBig}>36</span>
              <span style={styles.hudTimeFrac}>.638</span>
            </div>
            <div style={{ ...styles.hudLabel, color: '#a04000' }}>TOTAL</div>
            <div style={styles.hudTotal}>4:18.241</div>
            <div style={styles.hudDividerFaint} />
            <div style={styles.hudBest}>Best: 35.902</div>
          </div>
        </div>
        <div style={styles.showcaseLabel}>
          Actual HUD output — composited on black via Screen blend mode
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={styles.steps}>
        <h2 style={styles.sectionTitle}>How it works</h2>
        <div style={styles.stepsGrid}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} style={styles.step}>
              <div style={styles.stepNum}>0{i + 1}</div>
              <div style={styles.stepTitle}>{step.title}</div>
              <div style={styles.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={styles.finalCta}>
        <Link href="/create" style={styles.primaryCta}>
          Create Your Overlay Now
        </Link>
        <p style={styles.finalNote}>No account required. Free to try.</p>
      </section>

      <footer style={styles.footer}>
        <span style={styles.footerLogo}>KARTOVERLAY</span>
        <span style={styles.footerNote}>Built for karting families by a karting family.</span>
      </footer>
    </main>
  );
}

const HOW_STEPS = [
  {
    title: 'Upload your screenshot',
    desc: 'Drop in 1–2 screenshots from any karting timing app. AI reads your lap times instantly.',
  },
  {
    title: 'Preview your HUD',
    desc: 'Watch the animated lap timer run in real time in your browser. Exactly what the video will look like.',
  },
  {
    title: 'Download the overlay',
    desc: 'Get an AVI file with a near-black background. Import into Premiere or DaVinci, set blend mode to Screen, done.',
  },
  {
    title: 'Sync to your footage',
    desc: 'Use the lap change moments as sync markers. Your onboard video now has broadcast-quality timing data.',
  },
];

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'rgb(8,6,4)',
    position: 'relative',
    overflowX: 'hidden',
  },
  noise: {
    position: 'fixed',
    inset: 0,
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
    pointerEvents: 'none',
    zIndex: 0,
  },
  nav: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,100,0,0.1)',
  },
  logo: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '0.15em',
  },
  logoAccent: { color: '#ff6400' },
  logoMain: { color: '#fff' },
  navCta: {
    color: '#ff6400',
    textDecoration: 'none',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.05em',
    border: '1px solid rgba(255,100,0,0.4)',
    padding: '8px 16px',
    borderRadius: 4,
    transition: 'background 0.15s',
  },
  hero: {
    position: 'relative',
    zIndex: 10,
    maxWidth: 720,
    margin: '0 auto',
    padding: '100px 40px 60px',
    textAlign: 'center',
  },
  heroTag: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: '0.2em',
    color: '#ff6400',
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: '"Rajdhani", Arial, sans-serif',
    fontSize: 'clamp(40px, 7vw, 72px)',
    fontWeight: 700,
    lineHeight: 1.05,
    color: '#fff',
    marginBottom: 24,
    letterSpacing: '-0.01em',
  },
  heroTitleAccent: {
    background: 'linear-gradient(90deg, #ff5000, #ffaa00)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.55)',
    maxWidth: 540,
    margin: '0 auto 36px',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 400,
  },
  heroCtas: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryCta: {
    background: 'linear-gradient(135deg, #ff5000, #ff8c00)',
    color: '#fff',
    textDecoration: 'none',
    fontFamily: '"Rajdhani", Arial, sans-serif',
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: '0.05em',
    padding: '14px 32px',
    borderRadius: 6,
    display: 'inline-block',
    boxShadow: '0 0 32px rgba(255,80,0,0.3)',
  },
  secondaryCta: {
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    fontFamily: 'Arial, sans-serif',
    fontSize: 15,
    padding: '14px 20px',
    display: 'inline-block',
    alignSelf: 'center',
  },
  hudShowcase: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 40px 60px',
    gap: 16,
  },
  hudDemo: {
    width: 240,
    background: 'rgb(8,6,4)',
    border: '3px solid rgba(255,100,0,0.75)',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(255,100,0,0.2)',
  },
  hudAccentBar: {
    height: 5,
    background: 'linear-gradient(90deg, #ff5000, #ffaa00)',
  },
  hudInner: { padding: '14px 18px 16px' },
  hudLabel: {
    fontFamily: 'Arial, sans-serif',
    fontWeight: 700,
    fontSize: 10,
    color: '#ff6a00',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hudLapNum: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 700,
    fontSize: 68,
    color: '#fff',
    lineHeight: 1,
    marginBottom: 8,
  },
  hudDivider: {
    height: 1,
    background: 'rgba(255,100,0,0.18)',
    marginBottom: 8,
  },
  hudDividerFaint: {
    height: 1,
    background: 'rgba(255,100,0,0.1)',
    margin: '6px 0',
  },
  hudTimeRow: { display: 'flex', alignItems: 'baseline', marginBottom: 4 },
  hudTimeBig: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 700,
    fontSize: 48,
    color: '#fff',
    lineHeight: 1,
  },
  hudTimeFrac: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 700,
    fontSize: 34,
    color: 'rgba(255,255,255,0.55)',
  },
  hudTotal: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 700,
    fontSize: 24,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 2,
  },
  hudBest: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 700,
    fontSize: 22,
    color: '#ffaa00',
  },
  showcaseLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  steps: {
    position: 'relative',
    zIndex: 10,
    maxWidth: 900,
    margin: '0 auto',
    padding: '60px 40px',
  },
  sectionTitle: {
    fontFamily: '"Rajdhani", Arial, sans-serif',
    fontWeight: 700,
    fontSize: 36,
    color: '#fff',
    letterSpacing: '0.03em',
    marginBottom: 40,
    textAlign: 'center',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
  },
  step: {
    background: 'rgba(255,100,0,0.04)',
    border: '1px solid rgba(255,100,0,0.15)',
    borderRadius: 8,
    padding: '24px 20px',
  },
  stepNum: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#ff6400',
    letterSpacing: '0.15em',
    marginBottom: 10,
  },
  stepTitle: {
    fontFamily: '"Rajdhani", Arial, sans-serif',
    fontWeight: 700,
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
  },
  stepDesc: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.6,
  },
  finalCta: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '40px 40px 80px',
    textAlign: 'center',
  },
  finalNote: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 13,
    fontFamily: 'Arial, sans-serif',
  },
  footer: {
    position: 'relative',
    zIndex: 10,
    borderTop: '1px solid rgba(255,100,0,0.1)',
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerLogo: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 13,
    color: '#ff6400',
    letterSpacing: '0.2em',
  },
  footerNote: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
  },
};
