import { UpgradeCard } from './types';

export const ALL_UPGRADES: UpgradeCard[] = [
  {
    id: 'multishot',
    name: 'Multishot Array',
    nameId: 'Laras Multishot',
    desc: 'Adds +1 additional projectile to your weapon spread',
    descId: 'Menambah +1 peluru tambahan pada tembakan senjata',
    icon: 'Sparkles',
    rarity: 'rare',
    apply: (player) => {
      player.projectileCount += 1;
    },
  },
  {
    id: 'damage_boost',
    name: 'Overcharged Plasma',
    nameId: 'Plasma Overdrive',
    desc: '+25% bullet damage to all weapons',
    descId: '+25% kerusakan peluru untuk semua senjata',
    icon: 'Zap',
    rarity: 'common',
    apply: (player) => {
      player.damageMultiplier *= 1.25;
    },
  },
  {
    id: 'fire_rate',
    name: 'Rapid Fire Coils',
    nameId: 'Kumparan Tembak Cepat',
    desc: '+30% weapon attack speed and reduced cooldown',
    descId: '+30% kecepatan tembak senjata',
    icon: 'Gauge',
    rarity: 'common',
    apply: (player) => {
      player.fireRateMultiplier *= 1.3;
    },
  },
  {
    id: 'orbital_drone',
    name: 'Orbital Defense Drone',
    nameId: 'Drone Pertahanan Orbital',
    desc: 'Deploys an autonomous drone orbiting you that attacks nearby targets',
    descId: 'Menerbangkan drone tempur yang mengorbit dan menembak musuh otomatis',
    icon: 'Bot',
    rarity: 'epic',
    apply: (player) => {
      player.droneCount += 1;
    },
  },
  {
    id: 'shield_boost',
    name: 'Nano-Shield Reinforce',
    nameId: 'Pelindung Nano Shield',
    desc: '+35 Max Shield and 50% faster shield recharge',
    descId: '+35 Kapasitas Perisai & regenerasi 50% lebih cepat',
    icon: 'Shield',
    rarity: 'common',
    apply: (player) => {
      player.maxShield += 35;
      player.shield = player.maxShield;
      player.shieldRechargeRate *= 1.5;
    },
  },
  {
    id: 'hull_plating',
    name: 'Titanium Hull Plating',
    nameId: 'Pelat Lambung Titanium',
    desc: '+40 Max Hull HP and immediately restores 40 HP',
    descId: '+40 HP lambung maksimal dan langsung memulihkan 40 HP',
    icon: 'Heart',
    rarity: 'rare',
    apply: (player) => {
      player.maxHp += 40;
      player.hp = Math.min(player.maxHp, player.hp + 40);
    },
  },
  {
    id: 'chain_lightning',
    name: 'Chain Arc Coils',
    nameId: 'Petir Rantai Voltaik',
    desc: 'Projectiles trigger electric shocks arcing to nearby enemies',
    descId: 'Tembakan memicu lompatan sengatan petir ke musuh terdekat',
    icon: 'Activity',
    rarity: 'legendary',
    apply: (player) => {
      player.chainLightning = true;
      player.chainTargets = (player.chainTargets || 0) + 2;
    },
  },
  {
    id: 'magnet_vacuum',
    name: 'Gravitational Magnet',
    nameId: 'Magnet Gravitasi',
    desc: '+100% vacuum pull range for XP energy crystals and repair kits',
    descId: '+100% jangkauan tarikan kristal XP dan item perbaikan',
    icon: 'Radio',
    rarity: 'common',
    apply: (player) => {
      player.magnetRadius *= 2.0;
    },
  },
  {
    id: 'thrusters',
    name: 'Hyperdrive Thrusters',
    nameId: 'Pendorong Hiperdrive',
    desc: '+20% movement speed and 25% faster dash recharge',
    descId: '+20% kecepatan manuver & pengisian dash 25% lebih cepat',
    icon: 'Wind',
    rarity: 'common',
    apply: (player) => {
      player.speedMultiplier *= 1.2;
      player.dashCooldownMax = Math.max(30, player.dashCooldownMax * 0.75);
    },
  },
  {
    id: 'piercing_shots',
    name: 'Hyper-Piercing Rounds',
    nameId: 'Peluru Penembus Zirah',
    desc: 'Projectiles pierce through 1 additional enemy target',
    descId: 'Peluru dapat menembus 1 musuh tambahan',
    icon: 'Crosshair',
    rarity: 'rare',
    apply: (player) => {
      player.piercingCount += 1;
    },
  },
  {
    id: 'cryo_freeze',
    name: 'Cryo-Stasis Rounds',
    nameId: 'Amunisi Pembeku Cryo',
    desc: 'Enemy hits slow enemy movement by 45% for 2.5 seconds',
    descId: 'Tembakan memperlambat pergerakan musuh sebesar 45%',
    icon: 'Snowflake',
    rarity: 'epic',
    apply: (player) => {
      player.cryoEnabled = true;
    },
  },
  {
    id: 'emp_pulse',
    name: 'Overload EMP Generator',
    nameId: 'Generator Gelombang EMP',
    desc: 'Automatically emits a devastating EMP wave every 12 seconds',
    descId: 'Secara otomatis melepaskan gelombang EMP dahsyat setiap 12 detik',
    icon: 'Sun',
    rarity: 'legendary',
    apply: (player) => {
      player.empEnabled = true;
    },
  },
];

export function getRandomUpgrades(count = 3): UpgradeCard[] {
  const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
