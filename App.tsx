/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Language, ShipConfig, UpgradeCard, RunStats, ActivePerk } from './game/types';
import { SHIPS } from './game/ships';
import { GameEngine } from './game/GameEngine';
import { sound } from './game/audio';
import { HUD } from './components/HUD';
import { UpgradeModal } from './components/UpgradeModal';
import { TitleMenu } from './components/TitleMenu';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedShip, setSelectedShip] = useState<ShipConfig>(SHIPS[0]);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('nebula_raider_lang') as Language) || 'id';
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoFire, setAutoFire] = useState<boolean>(true);

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('nebula_raider_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isNewHigh, setIsNewHigh] = useState<boolean>(false);

  // HUD and state sync
  const [hudState, setHudState] = useState<{
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
  }>({
    hp: 100,
    maxHp: 100,
    shield: 60,
    maxShield: 60,
    level: 1,
    xp: 0,
    xpNext: 20,
    dashRatio: 1,
    score: 0,
    combo: 0,
    wave: 1,
    perks: [],
  });

  const [upgradeCards, setUpgradeCards] = useState<UpgradeCard[]>([]);
  const [endStats, setEndStats] = useState<RunStats | null>(null);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Language toggle
  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'id' ? 'en' : 'id';
      localStorage.setItem('nebula_raider_lang', next);
      return next;
    });
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  }, []);

  // Auto fire toggle
  const toggleAutoFire = useCallback(() => {
    setAutoFire((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.autoFire = next;
        engineRef.current.player.autoFire = next;
      }
      return next;
    });
  }, []);

  // Start game run
  const startGame = useCallback(() => {
    if (!canvasRef.current) return;

    // Set dimensions
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;

    if (engineRef.current) {
      engineRef.current.stop();
    }

    const engine = new GameEngine(canvasRef.current, selectedShip);
    engineRef.current = engine;
    engine.autoFire = autoFire;
    engine.player.autoFire = autoFire;

    // Setup callbacks
    engine.onStateSync = (data) => {
      setHudState(data);
    };

    engine.onLevelUp = (cards) => {
      setUpgradeCards(cards);
      setGameState('UPGRADING');
    };

    engine.onGameOver = (stats) => {
      setEndStats(stats);
      if (stats.score > highScore) {
        setHighScore(stats.score);
        setIsNewHigh(true);
        localStorage.setItem('nebula_raider_highscore', stats.score.toString());
      } else {
        setIsNewHigh(false);
      }
      setGameState('GAMEOVER');
    };

    engine.onVictory = (stats) => {
      setEndStats(stats);
      if (stats.score > highScore) {
        setHighScore(stats.score);
        setIsNewHigh(true);
        localStorage.setItem('nebula_raider_highscore', stats.score.toString());
      } else {
        setIsNewHigh(false);
      }
      setGameState('VICTORY');
    };

    engine.start();
    setGameState('PLAYING');
  }, [selectedShip, autoFire, highScore]);

  // Apply chosen upgrade
  const handleSelectUpgrade = useCallback((card: UpgradeCard) => {
    if (engineRef.current) {
      engineRef.current.applyUpgrade(card);
    }
    setGameState('PLAYING');
  }, []);

  // Pause / Resume toggle
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      engineRef.current?.pause();
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      engineRef.current?.resume();
      setGameState('PLAYING');
    }
  }, [gameState]);

  // Keyboard shortcut for Escape / P (Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, togglePause]);

  // Virtual touch controls handlers
  const handleVirtualMove = useCallback((dx: number, dy: number, active: boolean) => {
    if (engineRef.current) {
      engineRef.current.virtualStick = { dx, dy, active };
    }
  }, []);

  const handleVirtualDash = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.virtualDash = true;
      setTimeout(() => {
        if (engineRef.current) engineRef.current.virtualDash = false;
      }, 80);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none text-slate-100">
      {/* Background HTML5 Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair block"
      />

      {/* Title / Hangar Menu */}
      {gameState === 'MENU' && (
        <TitleMenu
          selectedShip={selectedShip}
          highScore={highScore}
          isMuted={isMuted}
          lang={lang}
          onSelectShip={setSelectedShip}
          onStartGame={startGame}
          onToggleMute={toggleMute}
          onToggleLang={toggleLang}
        />
      )}

      {/* In-Game Heads Up Display (HUD) */}
      {(gameState === 'PLAYING' || gameState === 'UPGRADING' || gameState === 'PAUSED') && (
        <HUD
          hp={hudState.hp}
          maxHp={hudState.maxHp}
          shield={hudState.shield}
          maxShield={hudState.maxShield}
          level={hudState.level}
          xp={hudState.xp}
          xpNext={hudState.xpNext}
          dashRatio={hudState.dashRatio}
          score={hudState.score}
          combo={hudState.combo}
          wave={hudState.wave}
          bossHp={hudState.bossHp}
          bossMaxHp={hudState.bossMaxHp}
          bossName={hudState.bossName}
          perks={hudState.perks}
          isMuted={isMuted}
          isPaused={gameState === 'PAUSED'}
          autoFire={autoFire}
          lang={lang}
          onToggleMute={toggleMute}
          onTogglePause={togglePause}
          onToggleAutoFire={toggleAutoFire}
        />
      )}

      {/* Virtual Touch Joystick & Buttons for Mobile */}
      {gameState === 'PLAYING' && (
        <TouchControls
          onMove={handleVirtualMove}
          onDash={handleVirtualDash}
          onToggleAutoFire={toggleAutoFire}
          autoFire={autoFire}
        />
      )}

      {/* Roguelite Upgrade Selection Modal */}
      {gameState === 'UPGRADING' && (
        <UpgradeModal
          cards={upgradeCards}
          level={hudState.level}
          lang={lang}
          onSelect={handleSelectUpgrade}
        />
      )}

      {/* Paused Screen Overlay */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-2">
              {lang === 'id' ? 'GAME DIPAUSE' : 'GAME PAUSED'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {lang === 'id' ? 'Istirahat sejenak komandan.' : 'Mission temporarily suspended.'}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={togglePause}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{lang === 'id' ? 'Lanjutkan' : 'Resume'}</span>
              </button>

              <button
                onClick={startGame}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{lang === 'id' ? 'Mulai Ulang' : 'Restart'}</span>
              </button>

              <button
                onClick={() => {
                  engineRef.current?.stop();
                  setGameState('MENU');
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {lang === 'id' ? 'Kembali ke Menu Utama' : 'Quit to Main Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && endStats && (
        <GameOverModal
          isVictory={gameState === 'VICTORY'}
          stats={endStats}
          isNewHigh={isNewHigh}
          lang={lang}
          onPlayAgain={startGame}
          onReturnToMenu={() => setGameState('MENU')}
        />
      )}
    </div>
  );
}
