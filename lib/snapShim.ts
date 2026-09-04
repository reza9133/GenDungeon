'use client';
import type { EIP1193Provider } from './providerDiscovery';

// GenLayer's write flow probes wallet_getSnaps as part of its MetaMask
// Snap integration. Real MetaMask answers this cleanly. Wallets that only
// *pretend* to be MetaMask (OKX, Rabby, ...) don't implement it and their
// engine crashes instead of returning a clean "unsupported method" error.
// This makes that probe resolve gracefully for anything that isn't
// genuine MetaMask.
const SNAP_METHODS = new Set([
  'wallet_getSnaps',
  'wallet_requestSnaps',
  'wallet_invokeSnap',
  'wallet_snap',
]);

export function withSnapShim(provider: EIP1193Provider, isRealMetaMask: boolean): EIP1193Provider {
  if (isRealMetaMask) return provider; // don't touch the real flow

  return new Proxy(provider, {
    get(target, prop, receiver) {
      if (prop === 'request') {
        return async (args: { method: string; params?: unknown }) => {
          if (SNAP_METHODS.has(args?.method)) return {};
          return target.request(args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
