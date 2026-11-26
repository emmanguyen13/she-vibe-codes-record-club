import { useRef, useState } from 'react';
import type { Channel, DeckStatus } from '../../audio/engine';
import { useAnimationFrame } from '../../lib/hooks';
import { formatTime } from '../../lib/format';
import './stage.css';

/**
 * Seekable progress bar reading the channel's real playhead.
 * Native range input → keyboard & screen-reader friendly.
 */
export function ProgressBar({ channel, status, duration, label, compact }: {
  channel: Channel; status: DeckStatus; duration: number; label: string; compact?: boolean;
}) {
  const [pos, setPos] = useState(0);
  const scrubbing = useRef(false);
  useAnimationFrame(() => {
    if (!scrubbing.current) setPos(channel.position());
  }, status === 'PLAYING');
  const enabled = duration > 0 && status !== 'UNAVAILABLE' && status !== 'LOADING';
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
        disabled={!enabled}
        aria-label={label}
        aria-valuetext={`${formatTime(pos)} of ${formatTime(duration)}`}
        style={{ '--p': `${duration ? (pos / duration) * 100 : 0}%` } as React.CSSProperties}
        onPointerDown={() => (scrubbing.current = true)}
        onPointerUp={() => (scrubbing.current = false)}
        onChange={(e) => {
          const t = Number(e.target.value);
          setPos(t);
          channel.seek(t);
        }}
      />
      <span className="progress__time">{formatTime(duration)}</span>
    </div>
  );
}
