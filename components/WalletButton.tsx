'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/useWallet';

export function WalletButton() {
  const { address, connecting, error, connect, disconnect, walletType } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  // Shorten the address for a cleaner UI
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-amber-500 font-mono text-sm transition-colors shadow-lg"
        >
          {/* Small green dot to indicate online status */}
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div>
          {shortAddress}
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b border-slate-700">
              <p className="text-xs text-slate-400">Connected via {walletType}</p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        disabled={connecting}
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-slate-900 font-bold rounded-lg transition-colors shadow-lg"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showDropdown && !connecting && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          <button
            onClick={() => {
              connect('metamask');
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700 flex items-center gap-2"
          >
            🦊 MetaMask
          </button>
          <button
            onClick={() => {
              connect('rabby');
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700 flex items-center gap-2"
          >
            🐰 Rabby
          </button>
          <button
            onClick={() => {
              connect('okx');
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            🕸️ OKX Wallet
          </button>
        </div>
      )}
      
      {/* Display connection errors if any */}
      {error && (
        <div className="absolute top-full mt-2 right-0 w-64 p-3 text-xs text-red-400 bg-red-950/80 border border-red-900 rounded-lg z-50 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
