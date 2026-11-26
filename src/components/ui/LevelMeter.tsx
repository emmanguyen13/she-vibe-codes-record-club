import { useRef } from 'react';
import { useAnimationFrame } from '../../lib/hooks';
import './ui.css';

const SEGMENTS = 12;

/**
 * LED meter driven by a real AnalyserNode (channel or master). When the deck is not
 * playing the analyser is not read and every LED stays dark.
 */
type LevelSource = { level(): { rms: number; peak: number } };

export function LevelMeter({ channel, active, label }: { channel: LevelSource; active: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useAnimationFrame(() => {
    const el = ref.current;
    if (!el) return;
    const { rms, peak } = channel.level();
    const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
    const lit = Math.max(0, Math.min(SEGMENTS, Math.round(((db + 42) / 40) * SEGMENTS)));
    el.style.setProperty('--lit', String(lit));
    el.dataset.clip = peak > 0.98 ? 'true' : 'false';
    el.setAttribute('aria-valuenow', String(lit));
  }, active);
  return (
    <div
      ref={ref}
      className="meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={SEGMENTS}
      aria-valuenow={0}
      style={{ '--lit': 0 } as React.CSSProperties}
    >
      <span className="meter__clip" aria-hidden="true">♥</span>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span key={i} className="meter__led" style={{ '--n': SEGMENTS - i } as React.CSSProperties} />
      ))}
    </div>
  );
}
