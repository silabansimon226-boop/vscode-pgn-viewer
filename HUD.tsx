import React from 'react';
import { ActivePerk, Language } from '../game/types';
import { Volume2, VolumeX, Pause, Play, Sparkles, Shield, Heart, Zap, Crosshair } from 'lucide-react';

interface HUDProps {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  level: number;
  xp: number;
  xpNext: number;
  dashRatio: number;
  score: number;
  combo: number;
  wave: number;
  bossHp?: number;
  bossMaxHp?: number;
  bossName?: string;
  perks: ActivePerk[];
  isMuted: boolean;
  isPaused: boolean;
  autoFire: boolean;
  lang: Language;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleAutoFire: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  shield,
  maxShield,
  level,
  xp,
  xpNext,
  dashRatio,
  score,
  combo,
  wave,
  bossHp,
  bossMaxHp,
  bossName,
  perks,
  isMuted,
  isPaused,
  autoFire,
  lang,
  onToggleMute,
  onTogglePause,
  onToggleAutoFire,
}) => {
  const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
  const shieldRatio = Math.max(0, Math.min(1, shield / maxShield));
  const xpRatio = Math.max(0, Math.min(1, xp / xpNext));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 z-10">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between gap-4 pointer-events-auto">
        {/* Left: Player Vital Meters */}
        <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[280px]">
          {/* Hull HP Bar */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-lg">
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-400" />
                <span>{lang === 'id' ? 'Lambung Kapal' : 'Hull Integrity'}</span>
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.round(hp)} / {maxHp}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-rose-500 transition-all duration-150 ease-out rounded-full"
                style={{ width: `${hpRatio * 100}%` }}
              />
            </div>

            {/* Energy Shield Bar */}
            <div className="flex items-center justify-between text-xs mt-2.5 mb-1 font-medium">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Shield className="w-3.5 h-3.5 fill-sky-400" />
                <span>{lang === 'id' ? 'Perisai Energi' : 'Energy Shield'}</span>
              </span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.round(shield)} / {maxShield}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-sky-400 transition-all duration-100 ease-out rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                style={{ width: `${shieldRatio * 100}%` }}
              />
            </div>

            {/* Dash Meter */}
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-800/60 text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Dash [Spasi]</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-amber-300">
                {dashRatio >= 0.99
                  ? lang === 'id'
                    ? 'SIAP'
                    : 'READY'
                  : `${Math.round(dashRatio * 100)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Wave Indicator & Boss Bar */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2 shadow-lg flex items-center gap-4">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                {lang === 'id' ? 'Sektor' : 'Sector Wave'}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400">
                {wave}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                {lang === 'id' ? 'Skor' : 'Score'}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Combo Multiplier Alert */}
          {combo > 1 && (
            <div className="mt-2 text-xs font-mono font-bold tracking-wider text-amber-300 animate-pulse bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              COMBO x{combo} (+{Math.min(10, Math.floor(combo / 5)) * 25}%)
            </div>
          )}

          {/* Boss Bar if present */}
          {bossHp !== undefined && bossMaxHp !== undefined && (
            <div className="mt-3 w-[260px] sm:w-[420px] bg-slate-950/90 backdrop-blur-md border border-red-500/40 rounded-xl p-3 shadow-xl">
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-red-400">
                <span className="tracking-wide uppercase">{bossName || 'DREADNOUGHT'}</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {Math.round(bossHp)} / {bossMaxHp}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-red-950">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-100 ease-out rounded-full shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                  style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & XP Level */}
        <div className="flex flex-col items-end gap-2">
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-1.5 shadow-lg">
            <button
              onClick={onToggleAutoFire}
              title={lang === 'id' ? 'Bidikan Otomatis' : 'Auto Fire (E)'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                autoFire ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">
                {lang === 'id' ? 'Auto Tembak' : 'Auto-Fire'}
              </span>
            </button>
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Resume' : 'Pause'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>

          {/* Level & XP progress */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-lg min-w-[160px]">
            <div className="flex items-center justify-between text-xs mb-1 font-semibold">
              <span className="flex items-center gap-1 text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lv. {level}</span>
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                {Math.round(xp)} / {xpNext} XP
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-150 ease-out rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                style={{ width: `${xpRatio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD: Active Upgrade Perks list */}
      {perks.length > 0 && (
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 flex-wrap max-w-xl">
            {perks.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 flex items-center gap-1.5 shadow"
              >
                <span className="font-medium text-white">{p.name}</span>
                {p.count > 1 && (
                  <span className="text-[10px] font-mono font-bold text-sky-400">
                    x{p.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
