"use client"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid" // UUID comes from 'uuid' (already inferred by next-lite)
import { supabase, type Order, type OrderBookData } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useRealtimeOrderbook(selectedTerm: string) {
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Fetch initial data
  const fetchOrderBook = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: orders, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("term", Number(selectedTerm) as 30 | 90 | 180)
        .eq("status", "active")
        .order("rate", { ascending: true })

      if (fetchError) throw fetchError

      // Separate bids and asks
      const bids = orders?.filter((order) => order.type === "bid") || []
      const asks = orders?.filter((order) => order.type === "ask") || []

      // Calculate running totals
      let bidTotal = 0
      const bidsWithTotals = bids.map((bid) => {
        bidTotal += bid.amount
        return { ...bid, total: bidTotal }
      })

      let askTotal = 0
      const asksWithTotals = asks
        .sort((a, b) => b.rate - a.rate) // Sort asks descending
        .map((ask) => {
          askTotal += ask.amount
          return { ...ask, total: askTotal }
        })

      setOrderBook({
        bids: bidsWithTotals,
        asks: asksWithTotals,
      })

      setLastUpdate(new Date())
    } catch (err) {
      console.error("Error fetching order book:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch order book")
    } finally {
      setIsLoading(false)
    }
  }

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // --- helper to (re)subscribe safely ------------------------------------
    const createSubscription = () => {
      // ensure any previous channel is removed first – avoids “subscribe twice” error
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      // Every channel gets a unique topic so Strict-Mode’s double-mount can’t clash
      const topic = `orderbook-${selectedTerm}-${uuidv4()}`

      const newChannel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `term=eq.${selectedTerm}`,
          },
          (payload) => {
            const { eventType, new: newRecord } = payload

            // recent activity
            if (eventType === "INSERT" && newRecord) {
              setRecentActivity((prev) => [
                {
                  id: Date.now(),
                  type: newRecord.type === "bid" ? "new_bid" : "new_ask",
                  rate: newRecord.rate,
                  amount: newRecord.amount,
                  term: newRecord.term,
                  timestamp: Date.now(),
                },
                ...prev.slice(0, 4),
              ])
            } else if (eventType === "UPDATE" && newRecord?.status === "filled") {
              setRecentActivity((prev) => [
                {
                  id: Date.now(),
                  type: "filled",
                  rate: newRecord.rate,
                  amount: newRecord.amount,
                  term: newRecord.term,
                  timestamp: Date.now(),
                },
                ...prev.slice(0, 4),
              ])
            }

            // refresh data after any change
            fetchOrderBook()
            setLastUpdate(new Date())
          },
        )
        .subscribe()

      channelRef.current = newChannel
    }

    // first data fetch & subscription
    fetchOrderBook()
    createSubscription()

    // cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [selectedTerm])

  // Helper functions for order management
  const createOrder = async (orderData: Omit<Order, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("orders").insert([orderData]).select().single()

      if (error) throw error
      return data
    } catch (err) {
      console.error("Error creating order:", err)
      throw err
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId)

      if (error) throw error
    } catch (err) {
      console.error("Error cancelling order:", err)
      throw err
    }
  }

  const fillOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: "filled" }).eq("id", orderId)

      if (error) throw error
    } catch (err) {
      console.error("Error filling order:", err)
      throw err
    }
  }

  // Calculate market stats
  const bestBid = orderBook.bids[0]?.rate || 0
  const bestAsk = orderBook.asks[orderBook.asks.length - 1]?.rate || 0
  const spread = bestAsk - bestBid
  const totalLiquidity = orderBook.bids.reduce((sum, bid) => sum + bid.amount, 0)

  return {
    orderBook,
    isLoading,
    error,
    lastUpdate,
    recentActivity,
    bestBid,
    bestAsk,
    spread,
    totalLiquidity,
    createOrder,
    cancelOrder,
    fillOrder,
    refetch: fetchOrderBook,
  }
}
