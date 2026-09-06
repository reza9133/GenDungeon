import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";
import { findMetaMaskProvider } from "./eip6963";

/**
 * Deployed GenDungeon contract address (GenLayer Studio network).
 */
export const CONTRACT_ADDRESS =
  "0x689d7959eaE2f0397cA7a4847eA6B0269408Db76" as `0x${string}`;

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * A read-only client with no signer attached. Safe to use for every
 * `readContract` / view-method call, whether or not a wallet is connected.
 */
export function createReadOnlyClient() {
  return createClient({ chain: studionet });
}

export class MetaMaskNotFoundError extends Error {
  constructor() {
    super(
      "MetaMask was not found. GenLayer currently uses a MetaMask-specific " +
        "Snap to sign transactions, so it only works with the MetaMask " +
        "extension (not OKX or other wallets)."
    );
    this.name = "MetaMaskNotFoundError";
  }
}

/**
 * A client backed by MetaMask specifically.
 *
 * IMPORTANT: `genlayer-js`'s `client.connect()` reaches into the global
 * `window.ethereum` internally (it is not parameterized by the `provider`
 * we pass to `createClient`), and it drives MetaMask's Snaps API
 * directly. If another wallet extension (OKX, etc.) currently holds
 * `window.ethereum`, `connect()` fails with errors like
 * "Method not found: wallet_getSnaps".
 *
 * To make this reliable when multiple wallets are installed, we locate
 * the real MetaMask provider via EIP-6963 and point `window.ethereum` at
 * it before calling `connect()`. This is a workaround for a limitation
 * in the current `genlayer-js` release, not a design choice of ours -
 * revisit this once GenLayer's SDK accepts an explicit provider for
 * `connect()`.
 */
export async function createBrowserWalletClient(address: `0x${string}`) {
  const metamask = await findMetaMaskProvider();
  if (!metamask) {
    throw new MetaMaskNotFoundError();
  }

  // Make the ambiguous global point at the provider we actually verified
  // is MetaMask, for the duration of this session.
  window.ethereum = metamask;

  const client = createClient({
    chain: studionet,
    account: address,
    provider: metamask,
  });
  await client.connect("studionet");
  return client;
}

/**
 * A client backed by a locally generated "burner" key pair, useful for
 * quick testing against GenLayer Studio without a browser wallet. The
 * private key never leaves this device; fund the resulting address via
 * the faucet button (💧) in the GenLayer Studio account selector.
 */
export function createBurnerClient(privateKey: `0x${string}`) {
  const account = createAccount(privateKey);
  return createClient({ chain: studionet, account });
}

/**
 * Generates a brand new burner private key. Callers are responsible for
 * persisting it (e.g. localStorage) if the burner identity should survive
 * a page reload.
 */
export function generateBurnerPrivateKey(): `0x${string}` {
  return generatePrivateKey();
}

export function addressFromPrivateKey(privateKey: `0x${string}`) {
  return createAccount(privateKey).address;
}

export type AppGenLayerClient = GenLayerClient<any>;
