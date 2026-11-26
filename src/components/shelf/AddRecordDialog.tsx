import { useEffect, useId, useRef, useState } from 'react';
import { detectLink } from '../../audio/adapters';
import { catalogue, SWATCHES } from '../../data/catalogue';
import { Icon } from '../ui/Icon';
import './shelf.css';

type Props = { open: boolean; onClose: () => void; onAdded: (id: string) => void };

const SERVICES = ['Spotify', 'Apple Music', 'YouTube', 'SoundCloud'];

/**
 * Lets a visitor paste their own playlist / album / track link. The link is
 * only ever played through the service's official embed, and the record is
 * saved in this browser (localStorage) — nothing is uploaded anywhere.
 */
export function AddRecordDialog({ open, onClose, onAdded }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [swatch, setSwatch] = useState(0);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { link: useId(), title: useId(), hint: useId() };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setLink('');
      setTitle('');
      setTouched(false);
      setError(null);
      d.showModal();
      // showModal() focuses the first button; move focus to the link field instead
      requestAnimationFrame(() => linkInput.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const detected = detectLink(link);
  const showStatus = touched || link.length > 8;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const res = catalogue.add(link, title, swatch);
    if ('error' in res) setError(res.error);
    else onAdded(res.id);
  };

  return (
    <dialog
      ref={ref}
      className="addrec"
      aria-labelledby="addrec-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <form className="addrec__inner" onSubmit={submit} noValidate>
        <header className="addrec__head">
          <div>
            <p className="pixel addrec__eyebrow">Your mixtape</p>
            <h2 id="addrec-title">Put your playlist on the shelf</h2>
          </div>
          <button type="button" className="pill-btn pill-btn--icon" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>

        <label className="addrec__label" htmlFor={ids.link}>Paste a link</label>
        <input
          id={ids.link}
          className="addrec__input"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://open.spotify.com/playlist/…"
          value={link}
          aria-describedby={ids.hint}
          aria-invalid={showStatus && !detected.ok}
          onChange={(e) => {
            setLink(e.target.value);
            setError(null);
          }}
          onBlur={() => setTouched(true)}
          ref={linkInput}
        />
        <p id={ids.hint} className={`addrec__hint ${showStatus ? (detected.ok ? 'is-ok' : 'is-bad') : ''}`} aria-live="polite">
          {showStatus
            ? detected.ok
              ? `✓ ${detected.what} — plays in ${detected.kind === 'apple' ? 'Apple Music' : detected.kind === 'spotify' ? 'Spotify' : detected.kind === 'youtube' ? 'YouTube' : 'SoundCloud'}’s official player`
              : detected.error
            : `Works with ${SERVICES.join(', ')} — playlists, albums or single tracks.`}
        </p>

        <label className="addrec__label" htmlFor={ids.title}>Name it <span>(optional)</span></label>
        <input
          id={ids.title}
          className="addrec__input"
          type="text"
          maxLength={60}
          placeholder={detected.ok ? `My ${detected.what}` : 'Late-night coding mix'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <fieldset className="addrec__swatches">
          <legend className="addrec__label">Spine colour</legend>
          {SWATCHES.map((s, i) => (
            <label key={s.name} className="addrec__swatch" style={{ '--sw': s.spine } as React.CSSProperties}>
              <input type="radio" name="swatch" checked={swatch === i} onChange={() => setSwatch(i)} />
              <span aria-hidden="true" />
              <span className="sr-only">{s.name}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="addrec__error" role="alert">{error}</p>}

        <p className="addrec__fine">
          Saved only in this browser, on this device. Full tracks may need you to be signed in to that service.
        </p>
        <div className="addrec__actions">
          <button type="button" className="pill-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="pill-btn pill-btn--primary" disabled={!detected.ok}>
            <Icon name="plus" /> Add to shelf
          </button>
        </div>
      </form>
    </dialog>
  );
}
