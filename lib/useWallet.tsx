'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { setActiveProvider } from './genlayerClient';
import { startProviderDiscovery, requestProviders, getProviderByRdns, WALLET_RDNS, type EIP1193Provider } from './providerDiscovery';
import { withSnapShim } from './snapShim';

export type WalletType = 'metamask' | 'okx' | 'rabby' | null;

interface WalletState {
  address: `0x${string}` | null;
  walletType: WalletType;
  connecting: boolean;
  error: string | null;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

const LAST_ADDRESS_KEY = 'pledgelayer.lastConnectedAddress';
const LAST_WALLET_TYPE_KEY = 'pledgelayer.lastWalletType';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startProviderDiscovery();
  }, []);

  const getProvider = useCallback((type: WalletType): EIP1193Provider | null => {
    if (typeof window === 'undefined' || !type) return null;

    // 1) EIP-6963 first — an isolated reference straight from the
    //    extension, never through the shared/hijackable window.ethereum.
    requestProviders(); // catch anything injected after mount
    const viaEip6963 = getProviderByRdns(WALLET_RDNS[type]);
    if (viaEip6963) return viaEip6963;

    // 2) Legacy fallback for wallets that haven't shipped EIP-6963 yet.
    //    Never trust `isMetaMask` alone — OKX and Rabby set it too.
    const eth = (window as any).ethereum;
    const candidates: any[] = eth?.providers?.length ? eth.providers : eth ? [eth] : [];

    if (type === 'okx') {
      return (window as any).okxwallet ?? candidates.find((p) => p.isOkxWallet) ?? null;
    }
    if (type === 'rabby') {
      return (
        (window as any).rabby ??
        candidates.find((p) => p.isRabby) ??
        (eth?.isRabby ? eth : null)
      );
    }
    if (type === 'metamask') {
      return (
        candidates.find(
          (p) => p.isMetaMask && !p.isRabby && !p.isOkxWallet && !p.isBraveWallet && !p.isCoinbaseWallet
        ) ?? null
      );
    }
    return null;
  }, []);

  const connect = useCallback(async (type: WalletType) => {
    setError(null);
    const provider = getProvider(type);

    if (!provider) {
      setError(`The ${type} extension was not found. Please install it to continue.`);
      return;
    }

    try {
      setConnecting(true);
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts?.[0]) {
        const addr = accounts[0] as `0x${string}`;
        setAddress(addr);
        setWalletType(type);
        setActiveProvider(withSnapShim(provider, type === 'metamask'));
        window.sessionStorage.setItem(LAST_ADDRESS_KEY, addr);
        window.sessionStorage.setItem(LAST_WALLET_TYPE_KEY, type as string);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, [getProvider]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletType(null);
    setActiveProvider(null);
    window.sessionStorage.removeItem(LAST_ADDRESS_KEY);
    window.sessionStorage.removeItem(LAST_WALLET_TYPE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rememberedAddress = window.sessionStorage.getItem(LAST_ADDRESS_KEY);
    const rememberedType = window.sessionStorage.getItem(LAST_WALLET_TYPE_KEY) as WalletType;

    if (!rememberedAddress || !rememberedType) return;

    const provider = getProvider(rememberedType);
    if (!provider) return;

    provider
      .request({ method: 'eth_accounts' })
      .then((accounts: unknown) => {
        const list = accounts as string[];
        if (list?.[0]) {
          setAddress(list[0] as `0x${string}`);
          setWalletType(rememberedType);
          setActiveProvider(withSnapShim(provider, rememberedType === 'metamask'));
        }
      })
      .catch(() => {});
  }, [getProvider]);

  useEffect(() => {
    if (!walletType) return;
    const provider = getProvider(walletType);
    if (!provider?.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      if (list?.[0]) {
        setAddress(list[0] as `0x${string}`);
      } else {
        disconnect();
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [walletType, getProvider, disconnect]);

  const value = useMemo(
    () => ({ address, walletType, connecting, error, connect, disconnect }),
    [address, walletType, connecting, error, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
