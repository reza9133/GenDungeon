'use client';

export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  [key: string]: any;
}

interface EIP6963ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: EIP1193Provider;
}

// Vendor-assigned, stable IDs — unlike `isMetaMask`, wallets can't casually
// spoof these without impersonating another wallet's identity outright.
export const WALLET_RDNS = {
  metamask: 'io.metamask',
  okx: 'com.okex.wallet',
  rabby: 'io.rabby',
} as const;

const registry = new Map<string, EIP6963ProviderDetail>();
let started = false;

export function startProviderDiscovery() {
  if (typeof window === 'undefined' || started) return;
  started = true;

  window.addEventListener('eip6963:announceProvider', (event) => {
    const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
    if (detail?.info?.rdns) registry.set(detail.info.rdns, detail);
  });

  requestProviders();
}

/** Call again right before opening the wallet picker — catches extensions
 *  that inject after initial page load. */
export function requestProviders() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export function getProviderByRdns(rdns: string): EIP1193Provider | null {
  return registry.get(rdns)?.provider ?? null;
}
