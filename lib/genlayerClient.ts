import { createClient } from 'genlayer-js';

let activeProvider: any = null;

export function setActiveProvider(provider: any) {
  activeProvider = provider;
}

export const studionet = {
  id: 61999,
  name: 'GenLayer Studionet',
  nativeCurrency: {
    decimals: 18,
    name: 'GEN',
    symbol: 'GEN',
  },
  rpcUrls: {
    default: { http: ['https://studio.genlayer.com/api'] },
    public: { http: ['https://studio.genlayer.com/api'] },
  },
  blockExplorers: {
    default: { name: 'Studio Explorer', url: 'https://explorer-studio.genlayer.com' },
  },
};

/** Read-only client — no wallet needed. */
export const readClient = createClient({
  chain: studionet,
});

/** Write client bound to the connected wallet. */
export function getWriteClient(address: `0x${string}`) {
  if (!activeProvider) {
    throw new Error('No wallet provider found. Please connect your wallet first.');
  }
  return createClient({
    chain: studionet,
    account: address,
    provider: activeProvider,
  });
}

/** Prompts the connected wallet to switch to / add the GenLayer network. */
export async function ensureCorrectNetwork(address: `0x${string}`) {
  const client = getWriteClient(address);
  if (!activeProvider) return client;

  const chainIdHex = `0x${studionet.id.toString(16)}`;

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
              chainName: studionet.name,
              nativeCurrency: studionet.nativeCurrency,
              rpcUrls: [...studionet.rpcUrls.default.http],
              blockExplorerUrls: [studionet.blockExplorers.default.url],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add GenLayer Studionet:', addError);
      }
    } else {
      console.error('Failed to switch network:', switchError);
    }
  }

  return client;
}
