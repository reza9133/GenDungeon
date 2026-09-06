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
      "MetaMask was not found. This app only supports connecting with the " +
        "MetaMask extension (not OKX or other wallets)."
    );
    this.name = "MetaMaskNotFoundError";
  }
}

/**
 * A client backed by MetaMask specifically.
 *
 * IMPORTANT: we deliberately never call `genlayer-js`'s `client.connect()`
 * here. Looking at the SDK internals, `connect()` reaches into the global
 * `window.ethereum` directly (it ignores the `provider` passed to
 * `createClient`) and only does two things: (1) ask the wallet to add/
 * switch to the target chain, and (2) request installation of GenLayer's
 * MetaMask Snap. Neither is needed for us:
 *   - `studionet` is a Studio chain, and the SDK's own chain-match check
 *     (`assertChainMatch`) skips itself entirely for Studio chains, so
 *     there is nothing to add/switch.
 *   - Every RPC method actually used for signing (`eth_requestAccounts`,
 *     `eth_sendTransaction`, `personal_sign`, `eth_signTypedData_v4`, ...)
 *     is routed through the explicit `provider` we pass to `createClient`
 *     below - not through `window.ethereum` and not through the Snap.
 *
 * So `connect()` bought us nothing here, while forcing us to hijack the
 * shared `window.ethereum` global (breaking things whenever another
 * wallet extension, like OKX, also holds it) and occasionally surfacing
 * spurious "Method not found: wallet_getSnaps" failures. Skipping it -
 * the same approach PledgeLayer uses against `testnetBradbury` - is what
 * makes connecting reliable with multiple wallet extensions installed.
 */
export async function createBrowserWalletClient(address: `0x${string}`) {
  const metamask = await findMetaMaskProvider();
  if (!metamask) {
    throw new MetaMaskNotFoundError();
  }

  return createClient({
    chain: studionet,
    account: address,
    provider: metamask,
  });
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
