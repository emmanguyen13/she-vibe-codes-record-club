import { useRef, useState } from 'react';
import { useAnimationFrame } from '../../lib/hooks';
import { formatTime } from '../../lib/format';
import './stage.css';

type Props = {
  /** Reads the real playhead (seconds) from whichever player owns it. */
  getPosition: () => number;
  onSeek: (t: number) => void;
  playing: boolean;
  duration: number;
  enabled: boolean;
  label: string;
  compact?: boolean;
};

/** Seekable progress bar (native range input → keyboard & screen-reader friendly). */
export function ProgressBar({ getPosition, onSeek, playing, duration, enabled, label, compact }: Props) {
  const [pos, setPos] = useState(0);
  const scrubbing = useRef(false);
  useAnimationFrame(() => {
    if (!scrubbing.current) setPos(getPosition());
  }, playing);
  const on = enabled && duration > 0;
  return (
    <div className={`progress ${compact ? 'progress--compact' : ''}`}>
      <span className="progress__time">{formatTime(pos)}</span>
      <input
        type="range"
        className="progress__range"
        min={0}
        max={duration || 1}
        step={0.01}
        value={Math.min(pos, duration || 1)}
        disabled={!on}
        aria-label={label}
        aria-valuetext={`${formatTime(pos)} of ${formatTime(duration)}`}
        style={{ '--p': `${duration ? (Math.min(pos, duration) / duration) * 100 : 0}%` } as React.CSSProperties}
        onPointerDown={() => (scrubbing.current = true)}
        onPointerUp={() => (scrubbing.current = false)}
        onChange={(e) => {
          const t = Number(e.target.value);
          setPos(t);
          onSeek(t);
        }}
      />
      <span className="progress__time">{formatTime(duration)}</span>
    </div>
  );
}
