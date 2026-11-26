import { useSyncExternalStore } from 'react';
import { external } from './store';

export function useExternal() {
  return useSyncExternalStore(external.subscribe, external.getState, external.getState);
}
