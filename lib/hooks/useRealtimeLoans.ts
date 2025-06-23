'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { usePrivyWallet } from '@/hooks/use-privy-wallet';

type Loan = Database['public']['Tables']['loans']['Row'];
type SignedOrder = Database['public']['Tables']['signed_orders']['Row'];

interface UseRealtimeLoansOptions {
  lender?: string;
  borrower?: string;
  status?: 'active' | 'repaid' | 'liquidated';
  onUpdate?: (loan: Loan) => void;
}

export function useRealtimeLoans(options: UseRealtimeLoansOptions = {}) {
  const { address } = usePrivyWallet();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Use connected address if no specific address provided
  const effectiveLender = options.lender || (address as string);
  const effectiveBorrower = options.borrower || (address as string);

  const fetchLoans = useCallback(async () => {
    if (!effectiveLender && !effectiveBorrower) {
      setLoans([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('loans').select('*');

      // Apply filters
      if (options.lender) {
        query = query.eq('lender', options.lender);
      } else if (options.borrower) {
        query = query.eq('borrower', options.borrower);
      } else if (address) {
        // Get loans where user is either lender or borrower
        query = query.or(`lender.eq.${address},borrower.eq.${address}`);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveLender, effectiveBorrower, options.status, options.lender, options.borrower, address]);

  useEffect(() => {
    fetchLoans();

    if (!effectiveLender && !effectiveBorrower) return;

    // Create subscription for loan updates
    const newChannel = supabase
      .channel('loans-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loans',
        },
        (payload) => {
          const newLoan = payload.new as Loan;
          // Check if this loan is relevant to the user
          if (
            (options.lender && newLoan.lender === options.lender) ||
            (options.borrower && newLoan.borrower === options.borrower) ||
            (!options.lender && !options.borrower && address && 
             (newLoan.lender === address || newLoan.borrower === address))
          ) {
            setLoans((current) => [newLoan, ...current]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loans',
        },
        (payload) => {
          const updatedLoan = payload.new as Loan;
          setLoans((current) =>
            current.map((loan) =>
              loan.id === updatedLoan.id ? updatedLoan : loan
            )
          );
          options.onUpdate?.(updatedLoan);
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [fetchLoans, effectiveLender, effectiveBorrower, address, options]);

  const refresh = useCallback(() => {
    fetchLoans();
  }, [fetchLoans]);

  return {
    loans,
    loading,
    error,
    refresh,
    isSubscribed: channel?.state === 'joined',
  };
}

// Hook for real-time signed orders
export function useRealtimeSignedOrders(lender?: string) {
  const { address } = usePrivyWallet();
  const [orders, setOrders] = useState<SignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const effectiveLender = lender || (address as string);

  const fetchOrders = useCallback(async () => {
    if (!effectiveLender) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('signed_orders')
        .select('*')
        .eq('lender', effectiveLender)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching signed orders:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveLender]);

  useEffect(() => {
    fetchOrders();

    if (!effectiveLender) return;

    const channel = supabase
      .channel('signed-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signed_orders',
          filter: `lender=eq.${effectiveLender}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((current) => [payload.new as SignedOrder, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((current) =>
              current.map((order) =>
                order.id === payload.new.id ? payload.new as SignedOrder : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((current) =>
              current.filter((order) => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, effectiveLender]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
  };
}