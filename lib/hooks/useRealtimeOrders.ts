import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOrdersOptions {
  orderType?: 'bid' | 'ask';
  status?: 'active' | 'filled' | 'cancelled';
  term?: 30 | 90 | 180;
  onInsert?: (order: Order) => void;
  onUpdate?: (order: Order) => void;
  onDelete?: (order: Order) => void;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('orders').select('*');

      // Apply filters
      if (options.orderType) {
        query = query.eq('type', options.orderType);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.term) {
        query = query.eq('term', options.term);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [options.orderType, options.status, options.term]);

  // Set up real-time subscription
  useEffect(() => {
    fetchOrders();

    // Create channel with filters
    const filters: any = {};
    if (options.orderType) filters.type = `eq.${options.orderType}`;
    if (options.status) filters.status = `eq.${options.status}`;
    if (options.term) filters.term = `eq.${options.term}`;

    const newChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(',')
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((current) => [newOrder, ...current]);
          options.onInsert?.(newOrder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(',')
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((current) =>
            current.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );
          options.onUpdate?.(updatedOrder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const deletedOrder = payload.old as Order;
          setOrders((current) =>
            current.filter((order) => order.id !== deletedOrder.id)
          );
          options.onDelete?.(deletedOrder);
        }
      )
      .subscribe();

    setChannel(newChannel);

    // Cleanup subscription
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [fetchOrders, options]);

  // Refresh orders manually
  const refresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh,
    isSubscribed: channel?.state === 'joined',
  };
}