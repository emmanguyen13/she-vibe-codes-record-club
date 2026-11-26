import { siteConfig } from '../../config';

/**
 * Decorative sticker cluster in the stage corner. If a real QR destination is
 * configured we link to it in plain text; we never draw a fake scannable code.
 */
export function StageSticker() {
  return (
    <div className="stage-sticker" aria-hidden={siteConfig.qrUrl ? undefined : true}>
      <svg viewBox="0 0 64 64" className="stage-sticker__svg" aria-hidden="true">
        <defs>
          <linearGradient id="svc-iri" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFD6EC" />
            <stop offset=".4" stopColor="#E3D9FF" />
            <stop offset=".7" stopColor="#D2ECFF" />
            <stop offset="1" stopColor="#FFF4C4" />
          </linearGradient>
        </defs>
        <path d="M32 4c2 13 7 18 20 20-13 2-18 7-20 20-2-13-7-18-20-20 13-2 18-7 20-20Z" fill="url(#svc-iri)" stroke="#fff" strokeWidth="2" />
        <circle cx="50" cy="48" r="9" fill="#FF8FCB" stroke="#fff" strokeWidth="2" />
        <path d="M50 51.5s-4-2.4-4-5.1a2.2 2.2 0 0 1 4-1.3 2.2 2.2 0 0 1 4 1.3c0 2.7-4 5.1-4 5.1Z" fill="#fff" />
      </svg>
      {siteConfig.qrUrl && (
        <a className="stage-sticker__link" href={siteConfig.qrUrl} target="_blank" rel="noreferrer">Visit ↗</a>
      )}
    </div>
  );
}
