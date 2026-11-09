import React from 'react';
import { ShipConfig, Language } from '../game/types';
import { SHIPS } from '../game/ships';
import { Play, Volume2, VolumeX, Trophy, Shield, Zap, Flame, Globe } from 'lucide-react';

interface TitleMenuProps {
  selectedShip: ShipConfig;
  highScore: number;
  isMuted: boolean;
  lang: Language;
  onSelectShip: (ship: ShipConfig) => void;
  onStartGame: () => void;
  onToggleMute: () => void;
  onToggleLang: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  selectedShip,
  highScore,
  isMuted,
  lang,
  onSelectShip,
  onStartGame,
  onToggleMute,
  onToggleLang,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6 sm:p-8 z-30 select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-wider text-sky-400">
            NEBULA RAIDER
          </span>
          <span className="text-xs text-slate-500 font-mono">v1.0</span>
        </div>

        <div className="flex items-center gap-3">
          {/* High Score Badge */}
          {highScore > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {lang === 'id' ? 'REKOR:' : 'BEST:'} {highScore.toLocaleString()}
              </span>
            </div>
          )}

          {/* Language Switch */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'id' ? 'ID' : 'EN'}</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6 flex flex-col items-center">
        {/* Hero Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-rose-400 tracking-tight leading-tight mb-3">
            NEBULA RAIDER
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            {lang === 'id'
              ? 'Tembus nebula luar angkasa, hancurkan armada musuh, kumpulkan kristal daya, dan bangun kapal tempur tak terkalahkan.'
              : 'Pilot through hazardous nebula sectors, annihilate enemy fleets, harvest power crystals, and forge an unstoppable warship.'}
          </p>
        </div>

        {/* Ship Selection Grid */}
        <div className="w-full mb-8">
          <div className="text-center mb-4">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
              {lang === 'id' ? 'PILIH KAPAL TEMPUR' : 'SELECT YOUR WARSHIP'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SHIPS.map((ship) => {
              const isSelected = selectedShip.id === ship.id;
              const name = lang === 'id' ? ship.nameId : ship.name;
              const desc = lang === 'id' ? ship.descId : ship.desc;

              return (
                <button
                  key={ship.id}
                  onClick={() => onSelectShip(ship)}
                  className={`flex flex-col text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  {/* Ship Preview Graphic */}
                  <div className="w-full h-28 bg-slate-950 rounded-xl mb-4 flex items-center justify-center border border-slate-900 overflow-hidden relative">
                    {/* Stars in background */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />

                    {/* Ship Shape */}
                    <svg
                      width="54"
                      height="54"
                      viewBox="-25 -25 50 50"
                      className="transition-transform duration-300 group-hover:scale-110"
                    >
                      <polygon
                        points="20,0 -16,-15 -9,0 -16,15"
                        fill={ship.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <circle cx="2" cy="0" r="4" fill="#0f172a" />
                    </svg>
                  </div>

                  {/* Ship Title & Weapon */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <span className="text-[11px] font-mono uppercase text-slate-400">
                      {ship.weaponType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 flex-1 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>

                  {/* Stats Progress Bars */}
                  <div className="space-y-2 w-full pt-3 border-t border-slate-800/80 text-xs">
                    {/* HP / Armor */}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Shield className="w-3.5 h-3.5 text-rose-400" />
                        <span>{lang === 'id' ? 'Ketahanan' : 'Hull'}</span>
                      </span>
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${(ship.maxHp / 150) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'id' ? 'Kecepatan' : 'Speed'}</span>
                      </span>
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(ship.speed / 6.5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Firepower */}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Flame className="w-3.5 h-3.5 text-sky-400" />
                        <span>{lang === 'id' ? 'Daya Tembak' : 'Firepower'}</span>
                      </span>
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{
                            width: `${(ship.baseDamage * ship.fireRate / 140) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={onStartGame}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-500 hover:from-sky-400 hover:via-indigo-500 hover:to-sky-400 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{lang === 'id' ? 'LUNCURKAN MISI' : 'LAUNCH MISSION'}</span>
        </button>

        {/* Controls Instructions Card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-slate-300">
              W A S D / Panah
            </kbd>
            <span>{lang === 'id' ? 'Gerak' : 'Move'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-slate-300">
              Spasi / Shift
            </kbd>
            <span>{lang === 'id' ? 'Dash Elak' : 'Dash'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-slate-300">
              Mouse Klik
            </kbd>
            <span>{lang === 'id' ? 'Bidik & Tembak' : 'Aim & Shoot'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-slate-300">
              E
            </kbd>
            <span>{lang === 'id' ? 'Auto Tembak' : 'Auto Fire'}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-xs text-slate-600">
        <span>Nebula Raider Roguelite · Built with HTML5 Canvas & Web Audio API</span>
      </div>
    </div>
  );
};
