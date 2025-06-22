"use client"

import { useState, useEffect } from "react"

interface PriceData {
  price: number
  change24h: number
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useEthPrice() {
  const [priceData, setPriceData] = useState<PriceData>({
    price: 0,
    change24h: 0,
    isLoading: true,
    error: null,
    lastUpdated: null,
  })

  const fetchPrice = async () => {
    try {
      setPriceData((prev) => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true",
        {
          headers: {
            Accept: "application/json",
          },
        },
      )

      // Check for rate limiting (status 429)
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait before refreshing.")
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.ethereum) {
        setPriceData({
          price: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change || 0,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching ETH price:", error)
      setPriceData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch price",
      }))
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchPrice()

    // Set up interval for updates every 5 minutes instead of 30 seconds
    const interval = setInterval(fetchPrice, 300000) // Changed from 30000 to 300000

    return () => clearInterval(interval)
  }, [])

  return {
    ...priceData,
    refetch: fetchPrice,
  }
}
