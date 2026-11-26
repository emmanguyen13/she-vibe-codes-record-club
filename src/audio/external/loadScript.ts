const cache = new Map<string, Promise<void>>();

/** Loads a third-party script once, only when a record actually needs it. */
export function loadScript(src: string, ready?: (resolve: () => void) => void): Promise<void> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onerror = () => {
        cache.delete(src);
        reject(new Error(`Could not load ${new URL(src).hostname}. Check your connection or content blocker.`));
      };
      if (ready) ready(resolve);
      else el.onload = () => resolve();
      document.head.appendChild(el);
    });
    cache.set(src, p);
  }
  return p;
}
