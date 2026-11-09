import React, { useEffect } from 'react';
import { UpgradeCard, Language } from '../game/types';
import {
  Sparkles,
  Zap,
  Gauge,
  Bot,
  Shield,
  Heart,
  Activity,
  Radio,
  Wind,
  Crosshair,
  Snowflake,
  Sun,
  Award,
} from 'lucide-react';

interface UpgradeModalProps {
  cards: UpgradeCard[];
  level: number;
  lang: Language;
  onSelect: (card: UpgradeCard) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Gauge: <Gauge className="w-6 h-6" />,
  Bot: <Bot className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Radio: <Radio className="w-6 h-6" />,
  Wind: <Wind className="w-6 h-6" />,
  Crosshair: <Crosshair className="w-6 h-6" />,
  Snowflake: <Snowflake className="w-6 h-6" />,
  Sun: <Sun className="w-6 h-6" />,
};

const RARITY_STYLES = {
  common: {
    border: 'border-slate-700/80 hover:border-slate-500',
    badge: 'text-slate-400',
    glow: 'hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]',
    iconBg: 'bg-slate-800 text-slate-200',
  },
  rare: {
    border: 'border-sky-500/50 hover:border-sky-400',
    badge: 'text-sky-400 font-semibold',
    glow: 'hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]',
    iconBg: 'bg-sky-950/80 border border-sky-500/40 text-sky-300',
  },
  epic: {
    border: 'border-purple-500/50 hover:border-purple-400',
    badge: 'text-purple-400 font-semibold',
    glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    iconBg: 'bg-purple-950/80 border border-purple-500/40 text-purple-300',
  },
  legendary: {
    border: 'border-amber-500/60 hover:border-amber-400',
    badge: 'text-amber-400 font-bold',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    iconBg: 'bg-amber-950/80 border border-amber-500/50 text-amber-300',
  },
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  cards,
  level,
  lang,
  onSelect,
}) => {
  // Listen for keyboard numbers 1, 2, 3
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1' && cards[0]) onSelect(cards[0]);
      if (e.key === '2' && cards[1]) onSelect(cards[1]);
      if (e.key === '3' && cards[2]) onSelect(cards[2]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cards, onSelect]);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="max-w-3xl w-full flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-1">
            <Award className="w-4 h-4" />
            <span>
              {lang === 'id' ? `Level ${level} Tercapai!` : `Level ${level} Reached!`}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {lang === 'id' ? 'Pilih Peningkatan Tempur' : 'Select Combat Upgrade'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {lang === 'id'
              ? 'Tingkatkan kemampuan kapal tempurmu untuk bertahan melawan gelombang musuh.'
              : 'Upgrade your ship systems to withstand incoming enemy sectors.'}
          </p>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {cards.map((card, idx) => {
            const style = RARITY_STYLES[card.rarity];
            const icon = ICON_MAP[card.icon] || <Sparkles className="w-6 h-6" />;
            const title = lang === 'id' ? card.nameId : card.name;
            const description = lang === 'id' ? card.descId : card.desc;

            return (
              <button
                key={card.id}
                onClick={() => onSelect(card)}
                className={`relative flex flex-col items-start text-left p-5 bg-slate-900/90 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1.5 cursor-pointer ${style.border} ${style.glow}`}
              >
                {/* Hotkey tag */}
                <div className="absolute top-3 right-3 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  [{idx + 1}]
                </div>

                {/* Card Icon */}
                <div className={`p-3 rounded-xl mb-4 ${style.iconBg}`}>{icon}</div>

                {/* Rarity Label */}
                <span className={`text-[11px] uppercase tracking-wider mb-1 ${style.badge}`}>
                  {card.rarity}
                </span>

                {/* Card Title */}
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">{title}</h3>

                {/* Card Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-4 flex-1">
                  {description}
                </p>

                {/* Action button hint */}
                <div className="w-full text-center py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-white transition-colors border border-white/10">
                  {lang === 'id' ? 'Pilih Upgrade' : 'Select'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
