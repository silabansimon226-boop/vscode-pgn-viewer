import { ShipConfig } from './types';

export const SHIPS: ShipConfig[] = [
  {
    id: 'apex_striker',
    name: 'Apex Striker',
    nameId: 'Apex Striker',
    desc: 'Balanced assault vessel armed with rapid dual plasma cannons and agile thrusters.',
    descId: 'Pesawat serbu seimbang bersenjatakan meriam plasma ganda cepat dan manuver lincah.',
    color: '#38bdf8', // sky blue
    engineColor: '#0284c7',
    maxHp: 100,
    maxShield: 60,
    speed: 5.2,
    dashCooldown: 90, // frames (~1.5s)
    weaponType: 'plasma',
    baseDamage: 22,
    fireRate: 5.0, // shots per sec
  },
  {
    id: 'void_phantom',
    name: 'Void Phantom',
    nameId: 'Void Phantom',
    desc: 'High-speed stealth interceptor equipped with high-damage burst scatter-cannons.',
    descId: 'Pencegat siluman berkecepatan tinggi dengan shotgun sebaran energi mematikan.',
    color: '#ec4899', // pink/magenta
    engineColor: '#be185d',
    maxHp: 75,
    maxShield: 40,
    speed: 6.4,
    dashCooldown: 60, // frames (~1.0s)
    weaponType: 'scatter',
    baseDamage: 14,
    fireRate: 3.2,
  },
  {
    id: 'titan_aegis',
    name: 'Titan Aegis',
    nameId: 'Titan Aegis',
    desc: 'Heavily armored juggernaut armed with a focused continuous piercing beam & heavy shield.',
    descId: 'Kapal tempur berlapis baja tebal dengan sinar laser penembus dan perisai ekstra kuat.',
    color: '#f59e0b', // amber / gold
    engineColor: '#d97706',
    maxHp: 150,
    maxShield: 100,
    speed: 4.2,
    dashCooldown: 120, // frames (~2.0s)
    weaponType: 'beam',
    baseDamage: 32,
    fireRate: 4.2,
  },
];
