/**
 * ==============================================================================
 * DEFINICIONES DE TIPOS Y MODELOS - FERIA MÁGICA DEL JUGUETE
 * ==============================================================================
 */

import type { LogoConfig } from "../config/branding";

export interface GameResult {
  gameId: string;
  gameTitle: string;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  logoUsed: LogoConfig;
  rank?: string; // "S+", "S", "A", "B", "C", "D"
  rankLabel?: string;
  rankColor?: string;
  accuracy?: number; // 0 - 100%
  maxCombo?: number;
  perfectCount?: number;
  greatCount?: number;
  goodCount?: number;
  missCount?: number;
  totalNotes?: number;
  songTitle?: string;
  songArtist?: string;
  difficulty?: string;
  difficultyLabel?: string;
  difficultyColor?: string;
  isCustomChart?: boolean;
  customNotes?: any[];
  songFile?: string;
  bpm?: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
}

export interface GameMetadata {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  themeColor: string;
  badge?: string;
}
