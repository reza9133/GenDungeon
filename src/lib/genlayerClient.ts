import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { GenLayerClient } from "genlayer-js/types";

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

/**
 * A client backed by a browser wallet (MetaMask or any injected
 * EIP-1193 provider). Caller must have already confirmed
 * `window.ethereum` exists.
 */
export async function createBrowserWalletClient(address: `0x${string}`) {
  const client = createClient({
    chain: studionet,
    account: address,
    provider: window.ethereum,
  });
  // Prompts the wallet to add/switch to the Studio network if needed.
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
