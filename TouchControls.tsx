import React, { useRef, useState, useEffect } from 'react';
import { Zap, Crosshair } from 'lucide-react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number, active: boolean) => void;
  onDash: () => void;
  onToggleAutoFire: () => void;
  autoFire: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onDash,
  onToggleAutoFire,
  autoFire,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0, false);
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= maxRadius) {
      setKnobPos({ x: dx, y: dy });
      onMove(dx / maxRadius, dy / maxRadius, true);
    } else {
      const clampedX = (dx / dist) * maxRadius;
      const clampedY = (dy / dist) * maxRadius;
      setKnobPos({ x: clampedX, y: clampedY });
      onMove(clampedX / maxRadius, clampedY / maxRadius, true);
    }
  };

  // Only show on touch devices or small viewports
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!isTouchDevice) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {/* Virtual Joystick (Bottom Left) */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="absolute bottom-6 left-6 w-32 h-32 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/60 pointer-events-auto flex items-center justify-center touch-none shadow-xl"
      >
        <div
          className={`w-14 h-14 rounded-full bg-sky-500/80 border border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-transform duration-75 pointer-events-none ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
        {/* Auto Fire Toggle */}
        <button
          onClick={onToggleAutoFire}
          className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-xl transition-all ${
            autoFire
              ? 'bg-sky-600/90 border-sky-400 text-white shadow-sky-500/40'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
        >
          <Crosshair className="w-6 h-6" />
        </button>

        {/* Dash Button */}
        <button
          onClick={onDash}
          className="w-16 h-16 rounded-full bg-amber-500/90 border-2 border-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-90 transition-transform"
        >
          <Zap className="w-7 h-7 fill-slate-950" />
        </button>
      </div>
    </div>
  );
};
