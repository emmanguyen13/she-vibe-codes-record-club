import { useSyncExternalStore } from 'react';
import type { Channel } from './engine';

export function useChannel(ch: Channel) {
  return useSyncExternalStore(ch.subscribe, ch.getState, ch.getState);
}
