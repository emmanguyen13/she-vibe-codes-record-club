import type { Album } from '../../types';
import { CoverArt } from './CoverArt';
import './stage.css';

/** The sleeve that slides out of the shelf onto the stage (re-mounted per album → entrance animation). */
export function AlbumSleeve({ album }: { album: Album }) {
  return (
    <figure className="sleeve">
      <CoverArt album={album} className="sleeve__art" />
      <span className="sleeve__gloss" aria-hidden="true" />
      <figcaption className="sr-only">Sleeve artwork for {album.title} by {album.artist}</figcaption>
    </figure>
  );
}
