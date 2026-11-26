/** Official embed-only players (Spotify, Apple Music): controlled inside their own iframe. */
export function IframeEmbed({ kind, src, title }: { kind: 'spotify' | 'apple'; src: string; title: string }) {
  return (
    <iframe
      className={`embed embed--${kind}`}
      title={title}
      src={src}
      loading="lazy"
      allow={kind === 'apple' ? 'autoplay *; encrypted-media *; fullscreen *; clipboard-write' : 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'}
      sandbox={kind === 'apple' ? 'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation' : undefined}
    />
  );
}
