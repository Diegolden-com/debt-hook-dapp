"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Users,
  Info
} from "lucide-react"
import { MarketDepthChart } from "@/components/market-depth-chart"
import { BatchStatusIndicator, BatchSummary } from "@/components/batch-status-indicator"
import { useRealtimeOrderbook } from "@/hooks/use-realtime-orderbook"
import { useEnhancedOrderBook } from "@/hooks/use-enhanced-orderbook"

interface EnhancedOrderBookProps {
  onOrderSelect?: (order: any) => void
}

export function EnhancedOrderBook({ onOrderSelect }: EnhancedOrderBookProps) {
  const [selectedTerm, setSelectedTerm] = useState("30")
  const [showBatchOnly, setShowBatchOnly] = useState(false)

  // Use existing orderbook hook
  const {
    orderBook,
    isLoading: isOrderBookLoading,
    error: orderBookError,
    lastUpdate,
    recentActivity,
    bestBid,
    bestAsk,
    spread,
    totalLiquidity,
    refetch: refetchOrderBook,
  } = useRealtimeOrderbook(selectedTerm)

  // Use enhanced features for batch data
  const {
    batchOrders,
    currentBatch,
    batchStats,
    pendingBatchOrders,
  } = useEnhancedOrderBook(selectedTerm)

  // Filter orders based on batch preference
  const filteredBids = showBatchOnly 
    ? orderBook.bids.filter(bid => batchOrders.some(bo => bo.orderId === bid.id))
    : orderBook.bids

  const filteredAsks = showBatchOnly
    ? orderBook.asks.filter(ask => batchOrders.some(bo => bo.orderId === ask.id))
    : orderBook.asks

  if (orderBookError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load order book: {orderBookError}
              <Button onClick={refetchOrderBook} variant="outline" size="sm" className="ml-2">
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Order Book
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                {isOrderBookLoading ? "Loading..." : "Live"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time market depth for {selectedTerm}-day terms
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="batch-mode"
                checked={showBatchOnly}
                onCheckedChange={setShowBatchOnly}
              />
              <Label htmlFor="batch-mode" className="text-sm cursor-pointer">
                Batch orders only
              </Label>
            </div>
            <Tabs value={selectedTerm} onValueChange={setSelectedTerm}>
              <TabsList>
                <TabsTrigger value="30">30D</TabsTrigger>
                <TabsTrigger value="90">90D</TabsTrigger>
                <TabsTrigger value="180">180D</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Batch Status Summary */}
        {currentBatch && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <BatchSummary
                totalOrders={batchStats.totalOrders}
                pendingMatches={batchStats.pendingMatches}
                currentBatchNumber={currentBatch.batchNumber}
                nextExecutionTime={currentBatch.estimatedExecutionTime}
              />
            </AlertDescription>
          </Alert>
        )}

        {/* Market Depth Chart */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <MarketDepthChart 
            orderBook={orderBook} 
            selectedTerm={selectedTerm} 
            isLoading={isOrderBookLoading}
            batchOrders={showBatchOnly ? batchOrders : undefined}
          />
        </div>

        {/* Order Book Tables */}
        {isOrderBookLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading order book...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bids (Lenders) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-600">Bids (Lenders)</h3>
                <Badge variant="outline" className="text-xs">
                  {filteredBids.length}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span>Rate (%)</span>
                  <span>Amount (USDC)</span>
                  <span>Total</span>
                  <span>Status</span>
                </div>
                {filteredBids.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {showBatchOnly ? "No batch bids available" : "No bids available"}
                  </div>
                ) : (
                  filteredBids.map((bid) => {
                    const batchOrder = batchOrders.find(bo => bo.orderId === bid.id)
                    return (
                      <div
                        key={bid.id}
                        className="grid grid-cols-4 gap-2 text-sm py-1.5 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer rounded transition-all duration-300"
                        onClick={() => onOrderSelect?.({ 
                          ...bid, 
                          type: "bid", 
                          term: selectedTerm,
                          batchInfo: batchOrder 
                        })}
                      >
                        <span className="font-mono text-green-600">
                          {bid.rate.toFixed(1)}
                          {batchOrder?.matchedRate && batchOrder.matchedRate !== bid.rate && (
                            <span className="text-xs text-muted-foreground ml-1">
                              →{batchOrder.matchedRate.toFixed(1)}
                            </span>
                          )}
                        </span>
                        <span className="font-mono">{bid.amount.toLocaleString()}</span>
                        <span className="font-mono text-muted-foreground">{bid.amount.toLocaleString()}</span>
                        <BatchStatusIndicator
                          avsStatus={batchOrder?.avsStatus || "none"}
                          batchStatus={currentBatch?.status}
                          matchedRate={batchOrder?.matchedRate}
                          requestedRate={bid.rate}
                          isFullyMatched={batchOrder?.isFullyMatched}
                          batchNumber={currentBatch?.batchNumber}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Asks (Borrowers) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-red-600">Asks (Borrowers)</h3>
                <Badge variant="outline" className="text-xs">
                  {filteredAsks.length}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span>Rate (%)</span>
                  <span>Amount (USDC)</span>
                  <span>Total</span>
                  <span>Status</span>
                </div>
                {filteredAsks.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {showBatchOnly ? "No batch asks available" : "No asks available"}
                  </div>
                ) : (
                  filteredAsks.map((ask) => {
                    const batchOrder = batchOrders.find(bo => bo.orderId === ask.id)
                    return (
                      <div
                        key={ask.id}
                        className="grid grid-cols-4 gap-2 text-sm py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer rounded transition-all duration-300"
                        onClick={() => onOrderSelect?.({ 
                          ...ask, 
                          type: "ask", 
                          term: selectedTerm,
                          batchInfo: batchOrder 
                        })}
                      >
                        <span className="font-mono text-red-600">
                          {ask.rate.toFixed(1)}
                          {batchOrder?.matchedRate && batchOrder.matchedRate !== ask.rate && (
                            <span className="text-xs text-muted-foreground ml-1">
                              →{batchOrder.matchedRate.toFixed(1)}
                            </span>
                          )}
                        </span>
                        <span className="font-mono">{ask.amount.toLocaleString()}</span>
                        <span className="font-mono text-muted-foreground">{ask.amount.toLocaleString()}</span>
                        <BatchStatusIndicator
                          avsStatus={batchOrder?.avsStatus || "none"}
                          batchStatus={currentBatch?.status}
                          matchedRate={batchOrder?.matchedRate}
                          requestedRate={ask.rate}
                          isFullyMatched={batchOrder?.isFullyMatched}
                          batchNumber={currentBatch?.batchNumber}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Execution Path Info */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 text-blue-600" />
              Direct Execution
            </div>
            <p className="text-xs text-muted-foreground">
              Orders execute immediately when matched. Higher gas costs but instant settlement.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-purple-600" />
              Batch Matching (CoW)
            </div>
            <p className="text-xs text-muted-foreground">
              Orders are matched in batches for optimal rates. Lower gas, better prices, but delayed execution.
            </p>
          </div>
        </div>

        {/* Spread Info */}
        {bestBid > 0 && bestAsk > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Best Bid</div>
                <div className="font-mono font-semibold text-green-600">{bestBid.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Spread</div>
                <div className="font-mono font-semibold">{spread.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Best Ask</div>
                <div className="font-mono font-semibold text-red-600">{bestAsk.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity with Batch Info */}
        {recentActivity.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h4>
            <div className="space-y-1">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="text-xs flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1 ${
                      activity.type === "new_bid"
                        ? "text-green-600"
                        : activity.type === "new_ask"
                          ? "text-red-600"
                          : "text-blue-600"
                    }`}
                  >
                    {activity.type === "new_bid" && <TrendingUp className="w-3 h-3" />}
                    {activity.type === "new_ask" && <TrendingDown className="w-3 h-3" />}
                    {activity.type === "filled" && <CheckCircle className="w-3 h-3" />}
                    {activity.type === "new_bid" ? "New Bid" : activity.type === "new_ask" ? "New Ask" : "Filled"}
                    {activity.viaBatch && <Badge variant="outline" className="text-xs ml-1">Batch</Badge>}
                  </span>
                  <span className="font-mono">
                    {activity.rate.toFixed(1)}% • ${activity.amount.toLocaleString()} • {activity.term}D
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit', 
                      hour12: false 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t text-center">
          <div>
            <div className="text-sm text-muted-foreground">Total Liquidity</div>
            <div className="font-semibold">${totalLiquidity.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Active Orders</div>
            <div className="font-semibold">{orderBook.bids.length + orderBook.asks.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Batch Orders</div>
            <div className="font-semibold">{pendingBatchOrders}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Last Update</div>
            <div className="font-semibold text-green-600 text-xs">
              {lastUpdate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: false 
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Term</div>
            <div className="font-semibold">{selectedTerm} days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}