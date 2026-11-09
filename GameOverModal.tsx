import React from 'react';
import { RunStats, Language } from '../game/types';
import { Trophy, RotateCcw, Home, Skull, Award, Target, Zap, Clock, ShieldAlert } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  stats: RunStats;
  isNewHigh: boolean;
  lang: Language;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  stats,
  isNewHigh,
  lang,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-30 select-none overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Victory or Defeat Icon */}
        <div
          className={`p-4 rounded-2xl mb-4 ${
            isVictory
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}
        >
          {isVictory ? <Award className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
        </div>

        {/* New High Score Alert */}
        {isNewHigh && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full mb-3 animate-bounce">
            <Trophy className="w-3.5 h-3.5" />
            <span>{lang === 'id' ? 'REKOR SKOR BARU!' : 'NEW HIGH SCORE!'}</span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-1">
          {isVictory
            ? lang === 'id'
              ? 'MISI SELESAI · KEMENANGAN!'
              : 'MISSION ACCOMPLISHED!'
            : lang === 'id'
            ? 'KAPAL HANCUR · MISI GAGAL'
            : 'VESSEL COMPROMISED'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 text-center mb-6">
          {isVictory
            ? lang === 'id'
              ? 'Semua ancaman Dreadnought musuh berhasil dimusnahkan dari sektor nebula.'
              : 'The sector dreadnought was annihilated and space lanes secured.'
            : lang === 'id'
            ? 'Lambung kapal hancur di tengah badai tembakan musuh.'
            : 'Your hull gave in to overwhelming hostile planetary resistance.'}
        </p>

        {/* Primary Score Hero Box */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center mb-5">
          <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
            {lang === 'id' ? 'Skor Akhir' : 'Final Score'}
          </span>
          <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300">
            {stats.score.toLocaleString()}
          </span>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">
                {lang === 'id' ? 'Sektor Tercapai' : 'Wave Sector'}
              </span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {stats.wave}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <Target className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">
                {lang === 'id' ? 'Musuh Hancur' : 'Enemies Slain'}
              </span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {stats.enemiesDefeated}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">
                {lang === 'id' ? 'Kombo Maksimal' : 'Max Combo'}
              </span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {stats.maxCombo}x
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-slate-400 block">
                {lang === 'id' ? 'Waktu Bertahan' : 'Survival Time'}
              </span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {formatTime(stats.timeSurvivedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'id' ? 'Main Lagi' : 'Play Again'}</span>
          </button>
          <button
            onClick={onReturnToMenu}
            className="w-full sm:w-auto py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'id' ? 'Hanggar' : 'Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
