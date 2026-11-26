import { useRef } from 'react';
import './ui.css';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  tone?: 'pink' | 'blue' | 'lilac' | 'chrome';
};

const SWEEP = 270;

/**
 * Accessible rotary knob (role="slider"): drag up/down, arrow keys,
 * PageUp/PageDown, Home/End; double-click resets to default.
 */
export function Knob({ label, value, min, max, step = 1, defaultValue, onChange, format, disabled, tone = 'chrome' }: Props) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const t = (value - min) / (max - min);
  const angle = -SWEEP / 2 + t * SWEEP;
  const text = format ? format(value) : String(value);

  return (
    <div className={`knob knob--${tone} ${disabled ? 'is-disabled' : ''}`}>
      <div
        className="knob__dial"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        aria-disabled={disabled || undefined}
        onDoubleClick={() => !disabled && onChange(defaultValue)}
        onPointerDown={(e) => {
          if (disabled) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, v: value };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dy = drag.current.y - e.clientY;
          onChange(clamp(drag.current.v + (dy / 140) * (max - min)));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (disabled) return;
          const big = (max - min) / 10;
          const map: Record<string, number> = {
            ArrowUp: value + step, ArrowRight: value + step, ArrowDown: value - step, ArrowLeft: value - step,
            PageUp: value + big, PageDown: value - big, Home: min, End: max,
          };
          if (e.key in map) {
            e.preventDefault();
            onChange(clamp(map[e.key]));
          }
        }}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" className="knob__track" />
          <circle
            cx="24" cy="24" r="21" className="knob__arc"
            strokeDasharray={`${(t * SWEEP / 360) * 2 * Math.PI * 21} ${2 * Math.PI * 21}`}
            transform="rotate(135 24 24)"
          />
        </svg>
        <span className="knob__cap" style={{ transform: `rotate(${angle}deg)` }}>
          <span className="knob__pointer" />
        </span>
      </div>
      <span className="knob__label pixel">{label.split(' ').pop()}</span>
      <span className="knob__value">{text}</span>
    </div>
  );
}
