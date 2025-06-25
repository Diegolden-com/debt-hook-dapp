"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react"
import { useEthPrice } from "@/hooks/use-eth-price"

export function EthPriceDisplay() {
  const { price, change24h, isLoading, error, lastUpdated, refetch } = useEthPrice()

  const isPositiveChange = change24h >= 0
  const changeColor = isPositiveChange ? "text-green-600" : "text-red-600"
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Price Feed Error</h3>
                <p className="text-sm text-muted-foreground">Failed to fetch ETH price</p>
              </div>
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">Ξ</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">ETH/USDC</h3>
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">
                  {isLoading ? (
                    <div className="animate-pulse bg-muted rounded h-8 w-32" />
                  ) : (
                    `$${price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  )}
                </span>
                {!isLoading && (
                  <div className={`flex items-center gap-1 ${changeColor} text-sm`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {isPositiveChange ? "+" : ""}
                      {change24h.toFixed(2)}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">(24h)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
            <div className="text-sm font-medium">
              {isLoading ? (
                <div className="animate-pulse bg-muted rounded h-4 w-20" />
              ) : lastUpdated ? (
                lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
              ) : (
                "Never"
              )}
            </div>
            <Button onClick={refetch} variant="ghost" size="sm" className="mt-2 h-8" disabled={isLoading}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary/20">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="font-semibold">$2.4B</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="font-semibold">$385B</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Active Loans</div>
            <div className="font-semibold">156</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
