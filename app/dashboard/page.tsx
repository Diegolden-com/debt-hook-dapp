"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ExternalLink,
  X,
  Zap,
  Activity,
  Target,
  Timer,
  Wallet,
  Edit,
  Pause,
  Play,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useEthPrice } from "@/hooks/use-eth-price"
import { useUserPositions } from "@/lib/hooks/contracts/useUserPositions"
import { useDebtHook } from "@/lib/hooks/contracts"
import { formatUnits, formatEther } from "viem"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { usePrivyWallet } from "@/hooks/use-privy-wallet"
import { PositionsTab } from "@/components/dashboard/PositionsTab"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  
  const { price: ethPrice, isLoading: isPriceLoading } = useEthPrice()
  const { address } = usePrivyWallet()
  const { borrowerPositions, lenderPositions, stats, isLoading: isLoadingPositions } = useUserPositions()
  const { repay, liquidate, isRepaying, isLiquidating } = useDebtHook()

  // Update time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch active orders from Supabase
  useEffect(() => {
    async function fetchActiveOrders() {
      if (!address) {
        setActiveOrders([])
        return
      }

      setIsLoadingOrders(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .or(`lender.eq.${address},borrower.eq.${address}`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error
        setActiveOrders(data || [])
      } catch (err) {
        console.error('Error fetching active orders:', err)
      } finally {
        setIsLoadingOrders(false)
      }
    }

    fetchActiveOrders()
  }, [address])

  // Split active orders by type
  const lendingOrders = activeOrders.filter(order => order.order_type === 'lending' && order.lender === address)
  const borrowingOrders = activeOrders.filter(order => order.order_type === 'borrowing' && order.borrower === address)

  // Calculate grace period (1 day after maturity)
  const GRACE_PERIOD = 24 * 60 * 60 // 1 day in seconds

  // Handle loan repayment
  const handleRepay = async (loanId: bigint, amount: bigint) => {
    await repay(loanId, amount)
    // Refresh positions after repayment
    if (stats) {
      window.location.reload()
    }
  }

  // Handle loan liquidation
  const handleLiquidate = async (loanId: bigint) => {
    await liquidate(loanId)
    // Refresh positions after liquidation
    if (stats) {
      window.location.reload()
    }
  }

  // Calculate portfolio statistics
  const portfolioStats = {
    totalLent: stats?.totalLent || 0,
    totalBorrowed: stats?.totalBorrowed || 0,
    totalCollateral: borrowerPositions.reduce((sum, pos) => sum + Number(formatEther(pos.collateralAmount)), 0),
    activeOrders: activeOrders.length,
    matchedPositions: borrowerPositions.length + lenderPositions.length,
    totalInterestEarned: stats?.totalInterestEarning || 0,
    totalInterestOwed: stats?.totalInterestOwed || 0,
    utilizationRate: lendingOrders.length > 0
      ? (lenderPositions.length / (lenderPositions.length + lendingOrders.length)) * 100
      : 0,
    avgLendingRate: lenderPositions.length > 0
      ? lenderPositions.reduce((sum, pos) => sum + Number(pos.interestRate), 0) / lenderPositions.length / 100
      : 0,
    avgBorrowingRate: borrowerPositions.length > 0
      ? borrowerPositions.reduce((sum, pos) => sum + Number(pos.interestRate), 0) / borrowerPositions.length / 100
      : 0,
  }

  const getHealthColor = (healthRatio: number) => {
    if (healthRatio >= 150) return "text-green-600"
    if (healthRatio >= 120) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "paused":
        return <Badge variant="secondary">Paused</Badge>
      case "filled":
        return <Badge variant="outline">Filled</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatTimeRemaining = (timestamp: string) => {
    const remaining = new Date(timestamp).getTime() - currentTime.getTime()
    if (remaining <= 0) return "Expired"
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const getHealthBadgeVariant = (healthRatio: number) => {
    if (healthRatio >= 150) return "default"
    if (healthRatio >= 120) return "secondary"
    return "destructive"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        )
      case "paused":
        return <Badge variant="secondary">Paused</Badge>
      case "healthy":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            Healthy
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Warning
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 animate-pulse">
            🚨 CRITICAL
          </Badge>
        )
      case "at_risk":
        return <Badge variant="destructive">At Risk</Badge>
      case "liquidated":
        return (
          <Badge variant="destructive" className="bg-gray-100 text-gray-800 border-gray-200">
            Liquidated
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTimeRemaining = (dateString: string) => {
    const maturity = new Date(dateString)
    const now = new Date()
    const diffTime = maturity.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "Expired"
    if (diffDays === 1) return "1 day"
    return `${diffDays} days`
  }

  const getGracePeriodCountdown = (gracePeriodEnd: string) => {
    const now = currentTime
    const graceEnd = new Date(gracePeriodEnd)
    const diffTime = graceEnd.getTime() - now.getTime()

    if (diffTime <= 0) return { expired: true, text: "LIQUIDATED" }

    const hours = Math.floor(diffTime / (1000 * 60 * 60))
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffTime % (1000 * 60)) / 1000)

    if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}m ${seconds}s`, urgent: hours < 6 }
    } else {
      return { expired: false, text: `${minutes}m ${seconds}s`, urgent: true }
    }
  }

  const getMaturityStatus = (maturityDate: string, gracePeriodEnd: string) => {
    const now = currentTime
    const maturity = new Date(maturityDate)
    const graceEnd = new Date(gracePeriodEnd)

    if (now > graceEnd) return "liquidated"
    if (now > maturity) return "grace_period"

    const timeToMaturity = maturity.getTime() - now.getTime()
    const hoursToMaturity = timeToMaturity / (1000 * 60 * 60)

    if (hoursToMaturity <= 24) return "critical"
    if (hoursToMaturity <= 72) return "warning"
    return "healthy"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lending Dashboard</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Manage your orders and monitor positions</span>
            {!isPriceLoading && (
              <>
                <span>•</span>
                <span>ETH: ${ethPrice.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6 md:mb-8">
            <TabsTrigger value="orders">Active Orders</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Lending Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Lending Orders
                </CardTitle>
                <CardDescription>Your EIP-712 signed offers waiting to be matched</CardDescription>
              </CardHeader>
              <CardContent>
                {lendingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active lending orders</p>
                    <p className="text-sm">Create offers in the Market tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lendingOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-lg">${order.amount.toLocaleString()} USDC</div>
                            <div className="text-sm text-muted-foreground">
                              {order.rate}% APR • {order.term}D • Max LTV {order.max_ltv}%
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(order.status)}</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Type</div>
                            <div className="font-medium capitalize">{order.type}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Status</div>
                            <div className="font-medium capitalize">{order.status}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            {order.status === "paused" ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                            {order.status === "paused" ? "Resume" : "Pause"}
                          </Button>
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="flex items-center gap-1 text-red-600">
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Borrowing Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  Borrowing Orders
                </CardTitle>
                <CardDescription>Your borrowing requests with collateral committed</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-muted rounded-lg" />
                      <div className="h-20 bg-muted rounded-lg" />
                    </div>
                  </div>
                ) : borrowingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active borrowing orders</p>
                    <p className="text-sm">Create borrowing requests in the Market tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {borrowingOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-lg">${Number(order.loan_amount).toLocaleString()} USDC</div>
                            <div className="text-sm text-muted-foreground">
                              Max {Number(order.max_interest_rate) / 100}% APR • {order.loan_duration / (24 * 60 * 60)}D • {Number(formatEther(BigInt(order.collateral_amount)))} ETH collateral
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(order.status)}</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Expires</div>
                            <div className="font-medium">{formatTimeRemaining(order.expires_at)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Order ID</div>
                            <div className="font-mono text-xs">{order.id.slice(0, 8)}...</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Nonce</div>
                            <div className="font-medium">{order.nonce}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="flex items-center gap-1 text-red-600">
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="positions" className="space-y-6">
            <PositionsTab
              borrowerPositions={borrowerPositions}
              lenderPositions={lenderPositions}
              ethPrice={ethPrice}
              isLoading={isLoadingPositions}
              onRepay={handleRepay}
              onLiquidate={handleLiquidate}
              isRepaying={isRepaying}
              isLiquidating={isLiquidating}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Order & Position History
                </CardTitle>
                <CardDescription>Complete history of your DebtHook lending activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Counterparty</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Interest/Loss</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.type.includes("lending") ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : item.type.includes("borrowing") ? (
                                <TrendingDown className="h-4 w-4 text-blue-600" />
                              ) : item.type.includes("liquidated") ? (
                                <Zap className="h-4 w-4 text-red-600" />
                              ) : (
                                <X className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="capitalize text-sm">{item.type.replace(/_/g, " ")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">{item.orderId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${item.amount.toLocaleString()}</div>
                            {item.collateral && (
                              <div className="text-xs text-muted-foreground">{item.collateral} ETH</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.rate && (
                              <Badge variant="outline" className="font-mono">
                                {item.rate}%
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.counterparty && <div className="font-mono text-xs">{item.counterparty}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(item.timestamp).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell>
                            {item.interestEarned !== undefined && (
                              <div className="font-medium text-green-600">+${item.interestEarned.toFixed(2)}</div>
                            )}
                            {item.interestOwed !== undefined && (
                              <div className="font-medium text-red-600">${item.interestOwed.toFixed(2)}</div>
                            )}
                            {item.collateralLoss !== undefined && (
                              <div className="font-medium text-red-600">-${item.collateralLoss.toFixed(2)}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "completed"
                                  ? "default"
                                  : item.status === "active"
                                    ? "secondary"
                                    : item.status === "liquidated"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lending Performance</CardTitle>
                  <CardDescription>Your lending activity and returns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Interest Earned</span>
                      <span className="font-bold text-green-600">
                        +${portfolioStats.totalInterestEarned.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Capital Utilization</span>
                      <span className="font-medium">{portfolioStats.utilizationRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg Lending APR</span>
                      <span className="font-medium">{portfolioStats.avgLendingRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Lending Capital</span>
                      <span className="font-medium">${portfolioStats.totalLent.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Borrowing Costs</CardTitle>
                  <CardDescription>Monitor your borrowing expenses and risk</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Interest Owed</span>
                      <span className="font-bold text-red-600">${portfolioStats.totalInterestOwed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Collateral at Risk</span>
                      <span className="font-medium">{portfolioStats.totalCollateral.toFixed(2)} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg Borrowing APR</span>
                      <span className="font-medium">{portfolioStats.avgBorrowingRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Borrowed</span>
                      <span className="font-medium">${portfolioStats.totalBorrowed.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
