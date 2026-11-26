import type { Mode } from '../../types';
import { siteConfig } from '../../config';
import './layout.css';

/** Wordmark · Shelf/DJ segmented toggle · event pill (top of the stage card). */
export function StageBar({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div className="stagebar">
      <p className="stagebar__wordmark">
        {siteConfig.brand}
        <span className="stagebar__sparkle" aria-hidden="true">✦</span>
      </p>
      <div className="segmented" role="radiogroup" aria-label="Mode">
        {(['shelf', 'dj'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            tabIndex={mode === m ? 0 : -1}
            className="segmented__btn"
            onClick={() => onMode(m)}
            onKeyDown={(e) => {
              if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const next = m === 'shelf' ? 'dj' : 'shelf';
                onMode(next);
                (e.currentTarget.parentElement?.querySelector(`[data-mode="${next}"]`) as HTMLElement | null)?.focus();
              }
            }}
            data-mode={m}
          >
            {m === 'shelf' ? 'Shelf' : 'DJ'}
          </button>
        ))}
      </div>
      {siteConfig.eventLabel ? (
        <p className="stagebar__event pixel">
          <span className="stagebar__dot" aria-hidden="true" />
          {siteConfig.eventLabel}
        </p>
      ) : (
        <span />
      )}
    </div>
  );
}
