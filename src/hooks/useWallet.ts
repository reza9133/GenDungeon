import { useCallback, useEffect, useState } from "react";
import {
  addressFromPrivateKey,
  createBrowserWalletClient,
  createBurnerClient,
  generateBurnerPrivateKey,
  type AppGenLayerClient,
} from "../lib/genlayerClient";

const BURNER_KEY_STORAGE = "gendungeon.burnerPrivateKey";

export type WalletMode = "none" | "metamask" | "burner";

interface WalletState {
  mode: WalletMode;
  address: string | null;
  client: AppGenLayerClient | null;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    mode: "none",
    address: null,
    client: null,
    connecting: false,
    error: null,
  });

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({
        ...s,
        error: "No browser wallet (like MetaMask) was found.",
      }));
      return;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      if (!address) throw new Error("No account was selected.");
      const client = await createBrowserWalletClient(address as `0x${string}`);
      setState({
        mode: "metamask",
        address,
        client,
        connecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err?.message ?? "Wallet connection failed.",
      }));
    }
  }, []);

  const connectBurner = useCallback(() => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      let key = localStorage.getItem(BURNER_KEY_STORAGE) as `0x${string}` | null;
      if (!key) {
        key = generateBurnerPrivateKey();
        localStorage.setItem(BURNER_KEY_STORAGE, key);
      }
      const client = createBurnerClient(key);
      const address = addressFromPrivateKey(key);
      setState({
        mode: "burner",
        address,
        client,
        connecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err?.message ?? "Failed to create burner account.",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ mode: "none", address: null, client: null, connecting: false, error: null });
  }, []);

  // If a burner key already exists from a previous visit, reconnect
  // automatically so the player doesn't lose their session on refresh.
  useEffect(() => {
    const existing = localStorage.getItem(BURNER_KEY_STORAGE) as
      | `0x${string}`
      | null;
    if (existing && state.mode === "none") {
      connectBurner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, connectMetaMask, connectBurner, disconnect };
}
