import type { Album } from '../../types';
import { CoverArt } from './CoverArt';
import './stage.css';

type Props = { album: Album | undefined; spinning: boolean; rate?: number; className?: string };

/** Vinyl disc. Spins only while real audio is playing; sheen stays fixed like a light reflection. */
export function VinylRecord({ album, spinning, rate = 1, className = '' }: Props) {
  return (
    <div className={`vinyl ${className}`} style={{ '--spin': `${1.8 / rate}s` } as React.CSSProperties}>
      <div className={`vinyl__disc ${spinning ? 'is-spinning' : ''}`}>
        <div className="vinyl__label">{album ? <CoverArt album={album} showText={false} /> : null}</div>
        <span className="vinyl__hole" />
      </div>
      <span className="vinyl__sheen" aria-hidden="true" />
    </div>
  );
}
