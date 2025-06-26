'use client';

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
    // Skip Privy initialization during build or if no app ID
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    
    if (!appId || appId === "your_privy_app_id_here") {
      console.warn("Privy App ID not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID in your .env.local file.");
      return <>{children}</>;
    }
    
    return(
      <BasePrivyProvider
        appId={appId}
        config={{
          // Note: Smart wallets for EIP-4337 are configured in Privy Dashboard
          // Enable paymaster URL in dashboard settings for gasless transactions
          embeddedWallets: {
            createOnLogin: "all-users",
          },
          appearance: {
            accentColor: "#8B5CF6",
            theme: "light",
          },
          loginMethods: ["email", "wallet", "google", "twitter", "discord"],
          // Network configuration for Base Sepolia
          defaultChain: {
            id: 84532,
            name: "Base Sepolia",
            network: "base-sepolia",
            rpcUrls: {
              default: { http: ["https://sepolia.base.org"] },
              public: { http: ["https://sepolia.base.org"] },
            },
            blockExplorers: {
              default: { name: "BaseScan", url: "https://sepolia.basescan.org" },
            },
            nativeCurrency: {
              decimals: 18,
              name: "Ethereum",
              symbol: "ETH",
            },
          },
        }}
      >
        {children}
      </BasePrivyProvider>
    )
}