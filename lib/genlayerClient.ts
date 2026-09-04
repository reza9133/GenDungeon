import { createClient } from 'genlayer-js';
import { simulator } from 'genlayer-js/chains'; 

let activeProvider: any = null;

export function setActiveProvider(provider: any) {
  activeProvider = provider;
}

/** Read-only client — no wallet needed. */
export const readClient = createClient({
  chain: simulator,
});

/** Write client bound to the connected wallet. */
export function getWriteClient(address: `0x${string}`) {
  if (!activeProvider) {
    throw new Error('No wallet provider found. Please connect your wallet first.');
  }
  return createClient({
    chain: simulator,
    account: address,
    provider: activeProvider,
  });
}

/** Prompts the connected wallet to switch to / add the GenLayer network. */
export async function ensureCorrectNetwork(address: `0x${string}`) {
  const client = getWriteClient(address);
  if (!activeProvider) return client;

  const chainIdHex = `0x${simulator.id.toString(16)}`;

  try {
    await activeProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    if (switchError?.code === 4902) {
      try {
        await activeProvider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: simulator.name,
              nativeCurrency: simulator.nativeCurrency,
              rpcUrls: [...simulator.rpcUrls.default.http],
              blockExplorerUrls: [],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add GenLayer Studio network:', addError);
      }
    } else {
      console.error('Failed to switch network:', switchError);
    }
  }

  return client;
}
