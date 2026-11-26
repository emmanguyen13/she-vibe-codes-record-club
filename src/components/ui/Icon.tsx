type IconName =
  | 'play' | 'pause' | 'stop' | 'prev' | 'next' | 'heart' | 'heart-fill' | 'menu' | 'close'
  | 'sparkle' | 'plus' | 'sync' | 'cue' | 'info' | 'external' | 'shelf' | 'mixer';

const paths: Record<IconName, JSX.Element> = {
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />,
  pause: <><rect x="6.5" y="5" width="4" height="14" rx="1.6" fill="currentColor" /><rect x="13.5" y="5" width="4" height="14" rx="1.6" fill="currentColor" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />,
  prev: <><path d="M17 6.5v11a.8.8 0 0 1-1.25.66L8.5 13.1a1.3 1.3 0 0 1 0-2.2l7.25-5.06A.8.8 0 0 1 17 6.5Z" fill="currentColor" /><rect x="6" y="6" width="2.4" height="12" rx="1.2" fill="currentColor" /></>,
  next: <><path d="M7 6.5v11a.8.8 0 0 0 1.25.66l7.25-5.06a1.3 1.3 0 0 0 0-2.2L8.25 5.84A.8.8 0 0 0 7 6.5Z" fill="currentColor" /><rect x="15.6" y="6" width="2.4" height="12" rx="1.2" fill="currentColor" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  'heart-fill': <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  menu: <><rect x="4" y="7" width="16" height="2.2" rx="1.1" fill="currentColor" /><rect x="4" y="14.8" width="11" height="2.2" rx="1.1" fill="currentColor" /></>,
  close: <path d="M6.5 6.5l11 11m0-11-11 11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />,
  sparkle: <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" />,
  plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />,
  sync: <path d="M5 12a7 7 0 0 1 12-4.9L19 9M19 5v4h-4M19 12a7 7 0 0 1-12 4.9L5 15m0 4v-4h4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />,
  cue: <><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="2.6" fill="currentColor" /></>,
  info: <><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 11v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><circle cx="12" cy="8" r="1.3" fill="currentColor" /></>,
  external: <path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  shelf: <><rect x="4" y="5" width="3" height="14" rx="1" fill="currentColor" /><rect x="8.5" y="7" width="3" height="12" rx="1" fill="currentColor" /><rect x="13" y="5" width="3" height="14" rx="1" fill="currentColor" /><path d="m17.5 8.2 2.6-.7 2.9 10.9-2.6.7z" fill="currentColor" /></>,
  mixer: <><circle cx="7" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M11 12h2" stroke="currentColor" strokeWidth="2" /></>,
};

export function Icon({ name, className = 'icon', title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
