'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { unichainSepolia } from 'viem/chains';

export function usePrivyWallet() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    async function setupWallet() {
      if (!ready || !authenticated || wallets.length === 0) {
        setWalletClient(null);
        setAddress(null);
        return;
      }

      // Get the first wallet (either embedded or external)
      const wallet = wallets[0];
      
      try {
        // Get the provider from the wallet
        const provider = await wallet.getEthereumProvider();
        
        // Create a viem wallet client
        const client = createWalletClient({
          account: wallet.address as `0x${string}`,
          chain: unichainSepolia,
          transport: custom(provider),
        });

        setWalletClient(client);
        setAddress(wallet.address as `0x${string}`);
      } catch (error) {
        console.error("Error setting up wallet:", error);
        setWalletClient(null);
        setAddress(null);
      }
    }

    setupWallet();
  }, [ready, authenticated, wallets]);

  return {
    ready,
    authenticated,
    user,
    walletClient,
    address,
    isConnected: authenticated && !!address,
  };
}