'use client';

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function ConnectWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <Button disabled variant="outline" size="sm">
        <Wallet className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (authenticated && user) {
    const address = user.wallet?.address || user.email?.address || "Connected";
    const displayAddress = address.startsWith("0x") 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;

    return (
      <Button onClick={logout} variant="outline" size="sm">
        {displayAddress}
      </Button>
    );
  }

  return (
    <Button onClick={login} size="sm">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}