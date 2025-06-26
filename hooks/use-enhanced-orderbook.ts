"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { BatchStatusSummary, UserPendingBatchOrder } from "@/types/database-extended"

export interface BatchOrder {
  orderId: string
  avsStatus: "none" | "submitted" | "pending_match" | "matched" | "executed" | "failed"
  matchedRate?: number
  matchedAmount?: number
  isFullyMatched?: boolean
  batchId?: string
}

export interface CurrentBatch {
  batchNumber: number
  status: "collecting" | "matching" | "executing" | "completed" | "failed"
  estimatedExecutionTime: Date
  totalOrders: number
  matchedPairs: number
}

export interface BatchStats {
  totalOrders: number
  pendingMatches: number
  averageSavings: number
  totalVolume: number
}

export function useEnhancedOrderBook(selectedTerm: string) {
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>([])
  const [currentBatch, setCurrentBatch] = useState<CurrentBatch | null>(null)
  const [batchStats, setBatchStats] = useState<BatchStats>({
    totalOrders: 0,
    pendingMatches: 0,
    averageSavings: 0,
    totalVolume: 0,
  })
  const [pendingBatchOrders, setPendingBatchOrders] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // For now, mock the batch data since views aren't in the current database
        const batchData: BatchStatusSummary | null = null
        const batchError = null

        if (batchError && batchError.code !== "PGRST116") {
          console.error("Batch fetch error:", batchError)
        }

        if (batchData) {
          setCurrentBatch({
            batchNumber: batchData.batch_number,
            status: batchData.status,
            estimatedExecutionTime: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
            totalOrders: batchData.total_orders || 0,
            matchedPairs: batchData.matched_pairs || 0,
          })
        }

        // For now, mock pending orders since views aren't in the current database
        const pendingOrders: UserPendingBatchOrder[] = []
        const pendingError = null

        if (pendingError) {
          console.error("Pending orders fetch error:", pendingError)
        }

        if (pendingOrders) {
          // Filter by term (maturity timestamp)
          const termDays = parseInt(selectedTerm)
          const filteredOrders = pendingOrders.filter(order => {
            const maturityDate = new Date(order.maturity_timestamp * 1000)
            const now = new Date()
            const daysDiff = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return Math.abs(daysDiff - termDays) < 15 // Within 15 days of selected term
          })

          const batchOrdersData: BatchOrder[] = filteredOrders.map(order => ({
            orderId: order.order_id,
            avsStatus: order.avs_status,
            matchedRate: order.matched_rate,
            matchedAmount: order.matched_amount,
            isFullyMatched: order.is_fully_matched,
            batchId: order.current_batch_id,
          }))

          setBatchOrders(batchOrdersData)
          setPendingBatchOrders(batchOrdersData.length)

          // Calculate stats
          const stats = {
            totalOrders: batchOrdersData.length,
            pendingMatches: batchOrdersData.filter(o => o.avsStatus === "pending_match").length,
            averageSavings: calculateAverageSavings(batchOrdersData),
            totalVolume: batchOrdersData.reduce((sum, o) => sum + (o.matchedAmount || 0), 0),
          }
          setBatchStats(stats)
        }
      } catch (err) {
        console.error("Error fetching batch data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch batch data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBatchData()

    // Set up real-time subscription for batch updates
    const batchChannel = supabase
      .channel(`batch-updates-${selectedTerm}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "batches",
        },
        () => {
          fetchBatchData()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "batch_orders",
        },
        () => {
          fetchBatchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(batchChannel)
    }
  }, [selectedTerm])

  return {
    batchOrders,
    currentBatch,
    batchStats,
    pendingBatchOrders,
    isLoading,
    error,
  }
}

function calculateAverageSavings(orders: BatchOrder[]): number {
  const savings = orders
    .filter(o => o.matchedRate && o.matchedAmount)
    .map(o => {
      // This is a simplified calculation
      // In reality, we'd compare against the requested rate
      return Math.abs((o.matchedRate || 0) * 0.05) // 5% average savings assumption
    })

  if (savings.length === 0) return 0
  return savings.reduce((a, b) => a + b, 0) / savings.length
}