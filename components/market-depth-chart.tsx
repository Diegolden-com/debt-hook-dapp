"use client"

import { useMemo } from "react"
import { Activity, TrendingUp, TrendingDown } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts"

interface MarketDepthChartProps {
  orderBook: {
    bids: Array<{
      id: string
      rate: number
      amount: number
      total?: number
    }>
    asks: Array<{
      id: string
      rate: number
      amount: number
      total?: number
    }>
  }
  selectedTerm: string // Kept for potential internal use, though title is removed
  isLoading: boolean
}

export function MarketDepthChart({ orderBook, selectedTerm, isLoading }: MarketDepthChartProps) {
  const chartData = useMemo(() => {
    if (!orderBook.bids.length && !orderBook.asks.length) {
      return {
        supplyData: [],
        demandData: [],
        equilibrium: null,
        maxQuantity: 0,
        maxRate: 0,
      }
    }
    const supplyData = orderBook.bids
      .sort((a, b) => a.rate - b.rate)
      .reduce((acc, bid) => {
        const cumulativeQuantity = acc.length > 0 ? acc[acc.length - 1].quantity + bid.amount : bid.amount
        acc.push({
          rate: bid.rate,
          quantity: cumulativeQuantity / 1000,
          type: "supply",
          originalAmount: bid.amount,
        })
        return acc
      }, [] as any[])

    const demandData = orderBook.asks
      .sort((a, b) => b.rate - a.rate)
      .reduce((acc, ask) => {
        const cumulativeQuantity = acc.length > 0 ? acc[acc.length - 1].quantity + ask.amount : ask.amount
        acc.push({
          rate: ask.rate,
          quantity: cumulativeQuantity / 1000,
          type: "demand",
          originalAmount: ask.amount,
        })
        return acc
      }, [] as any[])

    let equilibrium = null
    if (supplyData.length > 0 && demandData.length > 0) {
      const minSupplyRate = Math.min(...supplyData.map((d) => d.rate))
      const maxSupplyRate = Math.max(...supplyData.map((d) => d.rate))
      const minDemandRate = Math.min(...demandData.map((d) => d.rate))
      const maxDemandRate = Math.max(...demandData.map((d) => d.rate))
      const overlapMin = Math.max(minSupplyRate, minDemandRate)
      const overlapMax = Math.min(maxSupplyRate, maxDemandRate)
      if (overlapMin <= overlapMax) {
        const equilibriumRate = (overlapMin + overlapMax) / 2
        const equilibriumQuantity =
          (supplyData[Math.floor(supplyData.length / 2)]?.quantity +
            demandData[Math.floor(demandData.length / 2)]?.quantity) /
          2
        equilibrium = { rate: equilibriumRate, quantity: equilibriumQuantity }
      }
    }
    const maxQuantity = Math.max(...[...supplyData, ...demandData].map((d) => d.quantity), equilibrium?.quantity || 0)
    const maxRate = Math.max(...[...supplyData, ...demandData].map((d) => d.rate), equilibrium?.rate || 0)
    return { supplyData, demandData, equilibrium, maxQuantity, maxRate }
  }, [orderBook])

  const combinedData = useMemo(() => {
    const allRates = [...new Set([...chartData.supplyData.map((d) => d.rate), ...chartData.demandData.map((d) => d.rate)])].sort(
      (a, b) => a - b,
    )
    return allRates.map((rate) => {
      const supplyPoint = chartData.supplyData.find((d) => d.rate === rate)
      const demandPoint = chartData.demandData.find((d) => d.rate === rate)
      let supplyQuantity = null
      let demandQuantity = null
      if (supplyPoint) {
        supplyQuantity = supplyPoint.quantity
      } else if (chartData.supplyData.length > 0) {
        const lowerSupply = chartData.supplyData.filter((d) => d.rate <= rate).pop()
        const upperSupply = chartData.supplyData.find((d) => d.rate >= rate)
        if (lowerSupply && upperSupply && lowerSupply.rate !== upperSupply.rate) {
          const ratio = (rate - lowerSupply.rate) / (upperSupply.rate - lowerSupply.rate)
          supplyQuantity = lowerSupply.quantity + ratio * (upperSupply.quantity - lowerSupply.quantity)
        } else if (lowerSupply) {
          supplyQuantity = lowerSupply.quantity
        } else if (upperSupply) {
          supplyQuantity = upperSupply.quantity
        }
      }
      if (demandPoint) {
        demandQuantity = demandPoint.quantity
      } else if (chartData.demandData.length > 0) {
        const lowerDemand = chartData.demandData.filter((d) => d.rate >= rate).pop()
        const upperDemand = chartData.demandData.find((d) => d.rate <= rate)
        if (lowerDemand && upperDemand && lowerDemand.rate !== upperDemand.rate) {
          const ratio = (rate - upperDemand.rate) / (lowerDemand.rate - upperDemand.rate)
          demandQuantity = upperDemand.quantity + ratio * (lowerDemand.quantity - upperDemand.quantity)
        } else if (lowerDemand) {
          demandQuantity = lowerDemand.quantity
        } else if (upperDemand) {
          demandQuantity = upperDemand.quantity
        }
      }
      return { rate, supply: supplyQuantity, demand: demandQuantity }
    })
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Interest Rate: ${Number(label).toFixed(2)}%`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey === "supply" ? "Supply" : "Demand"}: $${Number(entry.value).toFixed(0)}K`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      // Simplified loading state without Card structure
      <div className="p-4 h-[400px] flex items-center justify-center">
        {" "}
        {/* Adjusted height */}
        <div className="animate-pulse text-muted-foreground">Loading market data...</div>
      </div>
    )
  }

  if (!chartData.supplyData.length && !chartData.demandData.length) {
    return (
      // Simplified empty state without Card structure
      <div className="p-4 h-[400px] flex items-center justify-center">
        {" "}
        {/* Adjusted height */}
        <div className="text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No market data available for {selectedTerm}D term</p>
          <p className="text-sm">Create orders to see supply and demand curves</p>
        </div>
      </div>
    )
  }

  return (
    // The main content of the chart, now without the Card wrapper.
    // Added p-4 to this root div to maintain padding.
    <div className="p-4">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="rate"
              type="number"
              scale="linear"
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              label={{
                value: "APR",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle" },
              }}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toFixed(0)}K`}
              label={{
                value: "Depth",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              wrapperStyle={{
                paddingBottom: "20px",
              }}
            />
            {chartData.supplyData.length > 0 && (
              <Line
                type="monotone"
                dataKey="supply"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                name="Lending"
                connectNulls={false}
              />
            )}
            {chartData.demandData.length > 0 && (
              <Line
                type="monotone"
                dataKey="demand"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                name="Borrowing"
                connectNulls={false}
              />
            )}
            {chartData.equilibrium && (
              <>
                <ReferenceDot
                  x={chartData.equilibrium.rate}
                  y={chartData.equilibrium.quantity}
                  r={8}
                  fill="#8b5cf6"
                  stroke="#ffffff"
                  strokeWidth={3}
                />
                <ReferenceLine
                  x={chartData.equilibrium.rate}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />
                <ReferenceLine
                  y={chartData.equilibrium.quantity}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground text-center mt-2">Open Market Depth in Thousands of Dollars</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            Supply Orders
          </div>
          <div className="font-semibold text-green-600">{chartData.supplyData.length}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
            <TrendingDown className="w-3 h-3 text-red-600" />
            Demand Orders
          </div>
          <div className="font-semibold text-red-600">{chartData.demandData.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Total Liquidity</div>
          <div className="font-semibold">${(chartData.maxQuantity * 1000).toLocaleString()}</div>
        </div>
        {chartData.equilibrium && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Equilibrium</div>
            <div className="font-semibold text-purple-600">
              {chartData.equilibrium.rate.toFixed(2)}% • ${(chartData.equilibrium.quantity * 1000).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Market Interpretation</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="text-green-600 font-medium">Supply Curve (Green):</span> Shows cumulative lending offers at
            each rate. Higher rates attract more lenders.
          </p>
          <p>
            <span className="text-red-600 font-medium">Demand Curve (Red):</span> Shows cumulative borrowing demand at
            each rate. Lower rates increase borrowing demand.
          </p>
          {chartData.equilibrium && (
            <p>
              <span className="text-purple-600 font-medium">Equilibrium Point:</span> Where supply meets demand,
              indicating the market-clearing rate and quantity.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
