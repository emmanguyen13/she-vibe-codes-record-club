import { useState } from 'react';
import { Icon } from './Icon';
import './ui.css';

type Props = { active: boolean; onToggle: () => void; label: string; className?: string; size?: 'sm' | 'md' };

/** Favourite toggle with a tiny sparkle burst when hearted. */
export function HeartButton({ active, onToggle, label, className = '', size = 'md' }: Props) {
  const [burst, setBurst] = useState(0);
  return (
    <button
      type="button"
      className={`pill-btn pill-btn--icon heart-btn heart-btn--${size} ${active ? 'is-active' : ''} ${className}`}
      aria-pressed={active}
      aria-label={label}
      title={active ? 'Remove from favourites' : 'Add to favourites'}
      onClick={() => {
        if (!active) setBurst((b) => b + 1);
        onToggle();
      }}
    >
      <Icon name={active ? 'heart-fill' : 'heart'} />
      {burst > 0 && (
        <span key={burst} className="heart-burst" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties}>{i % 2 ? '♥' : '✦'}</span>
          ))}
        </span>
      )}
    </button>
  );
}
