import { memo, useId } from 'react';
import type { Album } from '../../types';
import { readableInk } from '../../lib/color';

/** Deterministic pseudo-random from a string (stable art per album). */
function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEART = 'M0 3.2C0-1.6 6.6-1.8 6.6 3.2 6.6 7.4 0 11 0 11S-6.6 7.4-6.6 3.2C-6.6-1.8 0-1.6 0 3.2Z';
const SPARK = 'M0-10C1 -3 3-1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10Z';
const STAR5 = 'M0-10 2.9-3.1 10.5-3.1 4.3 1.6 6.6 9 0 4.6-6.6 9-4.3 1.6-10.5-3.1-2.9-3.1Z';

/**
 * Original, generated sleeve artwork. If `album.coverImage` is set (licensed
 * artwork supplied by the owner) that image is shown instead.
 */
export const CoverArt = memo(function CoverArt({ album, showText = true, className }: { album: Album; showText?: boolean; className?: string }) {
  const uid = useId().replace(/:/g, '');
  if (album.coverImage) {
    return <img className={className} src={album.coverImage} alt="" loading="lazy" decoding="async" />;
  }
  const { pattern, colors, stamp } = album.art;
  const [bg, c1, c2] = colors;
  const r = seeded(album.id);
  const g = (n: string) => `${uid}-${n}`;
  let motif: JSX.Element;

  switch (pattern) {
    case 'hearts':
      motif = (
        <>
          {Array.from({ length: 30 }, (_, i) => (
            <path key={i} d={HEART} transform={`translate(${(i % 6) * 18 + (Math.floor(i / 6) % 2) * 9} ${Math.floor(i / 6) * 20 + 6}) scale(.55)`} fill={i % 3 ? c2 : c1} opacity={0.55} />
          ))}
          <path d={HEART} transform="translate(50 44) scale(3.4)" fill={c1} stroke="#fff" strokeWidth=".6" />
          <path d="M38 40c2-4 6-6 9-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".8" />
        </>
      );
      break;
    case 'stars':
      motif = (
        <>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={SPARK} transform={`translate(${r() * 100} ${r() * 100}) scale(${0.2 + r() * 0.35})`} fill={i % 2 ? c1 : c2} />
          ))}
          <path d={STAR5} transform="translate(50 50) scale(3.1) rotate(-8)" fill={c1} stroke={c2} strokeWidth=".7" strokeLinejoin="round" />
        </>
      );
      break;
    case 'checker':
      motif = (
        <>
          <pattern id={g('chk')} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={c1} />
            <rect x="10" y="10" width="10" height="10" fill={c1} />
          </pattern>
          <rect width="100" height="100" fill={`url(#${g('chk')})`} opacity=".85" />
          <circle cx="50" cy="50" r="23" fill={bg} stroke={c2} strokeWidth="2.5" />
          <path d={HEART} transform="translate(50 46) scale(1.7)" fill={c2} />
        </>
      );
      break;
    case 'waves':
      motif = (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M-5 ${i * 12 + 6} q 12.5 -8 25 0 t 25 0 t 25 0 t 25 0 t 25 0`} stroke={i % 2 ? c1 : c2} strokeWidth="5" fill="none" strokeLinecap="round" />
          ))}
          <rect x="22" y="34" width="56" height="32" rx="7" fill={c2} stroke={c1} strokeWidth="2" />
          <rect x="22" y="34" width="56" height="8" rx="4" fill={c1} />
          <rect x="28" y="52" width={20 + r() * 20} height="6" rx="3" fill={c1} />
        </>
      );
      break;
    case 'bubbles':
      motif = (
        <>
          {Array.from({ length: 14 }, (_, i) => {
            const cx = r() * 100, cy = r() * 100, rad = 5 + r() * 14;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={rad} fill={i % 2 ? c1 : c2} opacity=".9" />
                <circle cx={cx - rad * 0.35} cy={cy - rad * 0.35} r={rad * 0.25} fill="#fff" opacity=".7" />
              </g>
            );
          })}
        </>
      );
      break;
    case 'flower': {
      const flower = (x: number, y: number, s: number, key: number, pc: string) => (
        <g key={key} transform={`translate(${x} ${y}) scale(${s})`}>
          {Array.from({ length: 6 }, (_, k) => (
            <ellipse key={k} cx="0" cy="-7" rx="4.2" ry="6.5" fill={pc} transform={`rotate(${k * 60})`} />
          ))}
          <circle r="4" fill={c2} />
        </g>
      );
      motif = (
        <>
          {Array.from({ length: 9 }, (_, i) => flower(r() * 100, r() * 100, 0.5 + r() * 0.5, i, i % 2 ? c1 : '#fff'))}
          {flower(50, 50, 2.6, 99, c1)}
        </>
      );
      break;
    }
    case 'smiley':
      motif = (
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={SPARK} transform={`translate(${r() * 100} ${r() * 100}) scale(.3)`} fill={c2} />
          ))}
          <circle cx="50" cy="50" r="27" fill={c2} stroke={c1} strokeWidth="2.5" />
          <ellipse cx="41" cy="44" rx="3" ry="5" fill={c1} />
          <ellipse cx="59" cy="44" rx="3" ry="5" fill={c1} />
          <path d="M37 56q13 13 26 0" stroke={c1} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case 'chrome':
      motif = (
        <>
          <linearGradient id={g('chr')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".3" stopColor="#c9cedb" />
            <stop offset=".5" stopColor="#ffffff" />
            <stop offset=".7" stopColor="#aab0c2" />
            <stop offset="1" stopColor="#f4f1ff" />
          </linearGradient>
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={-20 + i * 22} y="-20" width="9" height="140" fill={i % 2 ? c1 : c2} opacity=".5" transform="rotate(25 50 50)" />
          ))}
          <circle cx="50" cy="50" r="26" fill={`url(#${g('chr')})`} stroke="#fff" strokeWidth="1.5" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="48.5" y="27" width="3" height="3" fill="#fff" transform={`rotate(${i * 30} 50 50)`} opacity=".9" />
          ))}
          <path d={SPARK} transform="translate(66 32) scale(.6)" fill="#fff" />
        </>
      );
      break;
    case 'rings':
      motif = (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx="50" cy="56" r={46 - i * 5.5} fill="none" stroke={i % 2 ? c1 : c2} strokeWidth="3.4" />
          ))}
          <circle cx="50" cy="56" r="5" fill={c1} />
        </>
      );
      break;
    case 'pixel': {
      const px = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
      motif = (
        <>
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke={c2} strokeWidth=".6" opacity=".6" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke={c2} strokeWidth=".6" opacity=".6" />
          ))}
          {px.flatMap((row, y) =>
            [...row].map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={22 + x * 8} y={24 + y * 8} width="8" height="8" fill={c1} stroke={bg} strokeWidth=".6" /> : null)),
          )}
          <rect x="30" y="32" width="8" height="8" fill="#fff" opacity=".85" />
        </>
      );
      break;
    }
    case 'butterfly':
      motif = (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={r() * 100} cy={r() * 100} r={1 + r() * 2} fill={c2} />
          ))}
          <g transform="translate(50 52)">
            <ellipse cx="-14" cy="-10" rx="15" ry="19" fill={c1} transform="rotate(-25 -14 -10)" />
            <ellipse cx="14" cy="-10" rx="15" ry="19" fill={c1} transform="rotate(25 14 -10)" />
            <ellipse cx="-11" cy="13" rx="9" ry="12" fill={c2} transform="rotate(25 -11 13)" />
            <ellipse cx="11" cy="13" rx="9" ry="12" fill={c2} transform="rotate(-25 11 13)" />
            <circle cx="-14" cy="-12" r="5" fill="#fff" opacity=".7" />
            <circle cx="14" cy="-12" r="5" fill="#fff" opacity=".7" />
            <rect x="-2" y="-22" width="4" height="40" rx="2" fill="#34243D" />
            <path d="M-1-22q-4-8-9-9M1-22q4-8 9-9" stroke="#34243D" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        </>
      );
      break;
    case 'grid':
    default:
      motif = (
        <>
          <linearGradient id={g('sun')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
          <circle cx="50" cy="48" r="22" fill={`url(#${g('sun')})`} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="26" y={50 + i * 5} width="48" height={1.4 + i * 0.5} fill={bg} />
          ))}
          <rect x="0" y="62" width="100" height="38" fill={bg} />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1="50" y1="62" x2={-50 + i * 20} y2="100" stroke={c1} strokeWidth=".8" />
          ))}
          {[64, 68, 74, 82, 92].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke={c1} strokeWidth=".8" />
          ))}
        </>
      );
  }

  const inkOnBg = readableInk(bg);

  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={g('sheen')} cx=".25" cy=".15" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={bg} />
      {motif}
      {showText && (
        <g fontFamily="'Fredoka Variable', Fredoka, sans-serif" fill={inkOnBg}>
          <text x="6" y="10" fontSize="5.4" fontWeight="700" letterSpacing=".3">{album.artist.toUpperCase()}</text>
          <text x="6" y="95" fontSize="4.2" fontWeight="500" opacity=".85">{album.title}</text>
        </g>
      )}
      {showText && stamp && (
        <g transform="translate(86 86) rotate(-12)">
          <circle r="9" fill="#fff" stroke={c1} strokeWidth="1.2" />
          <text textAnchor="middle" y="1.6" fontSize="4.6" fontWeight="700" fontFamily="Silkscreen, monospace" fill="#34243D">{stamp}</text>
        </g>
      )}
      <rect width="100" height="100" fill={`url(#${g('sheen')})`} />
    </svg>
  );
});
