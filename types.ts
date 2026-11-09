export type GameState = 'MENU' | 'PLAYING' | 'UPGRADING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type Language = 'id' | 'en';

export interface ShipConfig {
  id: string;
  name: string;
  nameId: string;
  desc: string;
  descId: string;
  color: string;
  engineColor: string;
  maxHp: number;
  maxShield: number;
  speed: number;
  dashCooldown: number; // in frames or ms
  weaponType: 'plasma' | 'scatter' | 'beam';
  baseDamage: number;
  fireRate: number; // shots per sec
}

export interface UpgradeCard {
  id: string;
  name: string;
  nameId: string;
  desc: string;
  descId: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  apply: (player: any) => void;
}

export interface ActivePerk {
  id: string;
  name: string;
  count: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface RunStats {
  score: number;
  wave: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  damageDealt: number;
  maxCombo: number;
  timeSurvivedSeconds: number;
  crystalsCollected: number;
}
