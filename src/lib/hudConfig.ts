// src/lib/hudConfig.ts

export interface HudConfig {
  borderColor: string;
  accentBarColor: string;
  labelColor: string;
  primaryNumberColor: string;
  fracNumberColor: string;
  totalTimeColor: string;
  bestColor: string;
  bgColor: string;
  bgOpacity: number;
  showLapNumber: boolean;
  showLapTime: boolean;
  showTotal: boolean;
  showBest: boolean;
}

export const DEFAULT_CONFIG: HudConfig = {
  borderColor: '#FF6400',
  accentBarColor: '#FF6400',
  labelColor: '#FF6400',
  primaryNumberColor: '#FFFFFF',
  fracNumberColor: '#969696',
  totalTimeColor: '#555555',
  bestColor: '#FFAF00',
  bgColor: '#080604',
  bgOpacity: 100,
  showLapNumber: true,
  showLapTime: true,
  showTotal: true,
  showBest: true,
};
