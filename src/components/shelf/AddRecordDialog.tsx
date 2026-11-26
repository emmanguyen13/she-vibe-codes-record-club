import { useEffect, useId, useRef, useState } from 'react';
import { detectLink } from '../../audio/adapters';
import { catalogue, SWATCHES } from '../../data/catalogue';
import { wall, type WallStatus } from '../../data/wall';
import { Icon } from '../ui/Icon';
import './shelf.css';

type Where = 'wall' | 'mine';
type Props = { open: boolean; wallStatus: WallStatus; onClose: () => void; onAdded: (id: string, where: Where) => void };

const SERVICES = ['Spotify', 'Apple Music', 'YouTube', 'SoundCloud'];

/**
 * Lets a visitor paste their own playlist / album / track link. The link is
 * only ever played through the service's official embed, and the record is
 * saved in this browser (localStorage) — nothing is uploaded anywhere.
 */
export function AddRecordDialog({ open, wallStatus, onClose, onAdded }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [swatch, setSwatch] = useState(0);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const wallOn = wallStatus === 'ready';
  const [where, setWhere] = useState<Where>('wall');
  const target: Where = wallOn ? where : 'mine';
  const ids = { link: useId(), title: useId(), hint: useId(), handle: useId() };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setLink('');
      setTitle('');
      setTouched(false);
      setError(null);
      setBusy(false);
      d.showModal();
      // showModal() focuses the first button; move focus to the link field instead
      requestAnimationFrame(() => linkInput.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const detected = detectLink(link);
  const showStatus = touched || link.length > 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!detected.ok || busy) return;
    if (target === 'wall') {
      setBusy(true);
      const res = await wall.post({ link, title, handle, swatch });
      setBusy(false);
      if ('error' in res) setError(res.error);
      else onAdded(res.id, 'wall');
      return;
    }
    const res = catalogue.add(link, title, swatch);
    if ('error' in res) setError(res.error);
    else onAdded(res.id, 'mine');
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
            <h2 id="addrec-title">Share your playlist</h2>
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

        <fieldset className="addrec__where">
          <legend className="addrec__label">Where should it go?</legend>
          <label className={`addrec__choice ${target === 'wall' ? 'is-on' : ''} ${wallOn ? '' : 'is-disabled'}`}>
            <input type="radio" name="where" value="wall" checked={target === 'wall'} disabled={!wallOn} onChange={() => setWhere('wall')} />
            <span>
              <strong>Community wall</strong>
              <small>{wallOn ? 'Everyone visiting can see & play it' : 'Not connected right now'}</small>
            </span>
          </label>
          <label className={`addrec__choice ${target === 'mine' ? 'is-on' : ''}`}>
            <input type="radio" name="where" value="mine" checked={target === 'mine'} onChange={() => setWhere('mine')} />
            <span>
              <strong>Just my shelf</strong>
              <small>Saved only in this browser</small>
            </span>
          </label>
        </fieldset>

        {target === 'wall' && (
          <>
            <label className="addrec__label" htmlFor={ids.handle}>Your Threads handle <span>(optional)</span></label>
            <div className="addrec__handle">
              <span aria-hidden="true">@</span>
              <input
                id={ids.handle}
                className="addrec__input"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={40}
                placeholder="your.handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
          </>
        )}

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
          {target === 'wall'
            ? 'Posted publicly with the name and handle you give. Be kind — moderators can remove posts. Full tracks may need a sign-in to that service.'
            : 'Saved only in this browser, on this device. Full tracks may need you to be signed in to that service.'}
        </p>
        <div className="addrec__actions">
          <button type="button" className="pill-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="pill-btn pill-btn--primary" disabled={!detected.ok || busy}>
            <Icon name="plus" /> {busy ? 'Pinning…' : target === 'wall' ? 'Pin to the wall' : 'Add to my shelf'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
