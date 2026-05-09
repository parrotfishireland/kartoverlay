// kartoverlay/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KartOverlay — Professional Lap Timer Overlays',
  description:
    'Upload your karting lap times, get a professional animated HUD overlay video. Works with RaceChrono, AiM, MyChron and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
