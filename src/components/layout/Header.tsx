import type { Mode } from '../../types';
import { siteConfig } from '../../config';
import { Icon } from '../ui/Icon';
import { HeartButton } from '../ui/HeartButton';
import { MenuPopover } from './MenuPopover';
import './layout.css';

type Props = {
  mode: Mode;
  onMode: (m: Mode) => void;
  favouritesOnly: boolean;
  onFavouritesOnly: (v: boolean) => void;
  isFav: boolean;
  onFav: () => void;
  favLabel: string;
  onPrev: () => void;
  onNext: () => void;
};

export function Header({ mode, onMode, favouritesOnly, onFavouritesOnly, isFav, onFav, favLabel, onPrev, onNext }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <a className="brand-chip" href="#stage" aria-label={`${siteConfig.brand} — ${siteConfig.productName}`}>
          <span className="brand-chip__mark" aria-hidden="true">SVC</span>
        </a>
        <MenuPopover mode={mode} onMode={onMode} favouritesOnly={favouritesOnly} onFavouritesOnly={onFavouritesOnly} />
      </div>
      <div className="topbar__right">
        <HeartButton active={isFav} onToggle={onFav} label={favLabel} />
        <button type="button" className="pill-btn pill-btn--icon" onClick={onPrev} aria-label="Previous record">
          <Icon name="prev" />
        </button>
        <button type="button" className="pill-btn pill-btn--icon" onClick={onNext} aria-label="Next record">
          <Icon name="next" />
        </button>
      </div>
    </header>
  );
}
