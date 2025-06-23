'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeLoans, useRealtimeSignedOrders } from '@/lib/hooks/useRealtimeLoans';
import { usePrivyWallet } from '@/hooks/use-privy-wallet';
import { formatEther } from 'viem';

export function RealtimeNotifications() {
  const { address } = usePrivyWallet();
  const { toast } = useToast();

  // Listen for loan updates where user is involved
  const { loans } = useRealtimeLoans({
    onUpdate: (loan) => {
      // Notify on status changes
      if (loan.status === 'repaid') {
        toast({
          title: "Loan Repaid ✅",
          description: `Loan #${loan.loan_id} has been repaid`,
        });
      } else if (loan.status === 'liquidated') {
        toast({
          title: "Loan Liquidated ⚠️",
          description: `Loan #${loan.loan_id} has been liquidated`,
          variant: "destructive",
        });
      }
    },
  });

  // Listen for new loans created from user's orders
  useEffect(() => {
    if (!address) return;

    const handleNewLoan = (loan: any) => {
      if (loan.lender === address) {
        toast({
          title: "Order Filled 🎉",
          description: `Your loan offer has been accepted! Loan #${loan.loan_id} created.`,
        });
      } else if (loan.borrower === address) {
        toast({
          title: "Loan Created 💰",
          description: `You've successfully borrowed ${formatEther(BigInt(loan.loan_amount))} USDC`,
        });
      }
    };

    // You could enhance this with more specific subscriptions
    // This is a placeholder for the notification logic
  }, [address, toast]);

  return null; // This component doesn't render anything
}