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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders")
  const [currentTime, setCurrentTime] = useState(new Date())
  const { price: ethPrice, isLoading: isPriceLoading } = useEthPrice()

  // Update time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Active Orders (EIP-712 signed, waiting for match)
  const activeOrders = {
    lending: [
      {
        id: "LO001",
        type: "lending",
        usdcAmount: 20000,
        interestRate: 9.2,
        term: 90,
        maxLtv: 75,
        status: "active",
        createdAt: "2024-03-15T08:30:00Z",
        expiresAt: "2024-04-15T08:30:00Z",
        signature: "0x1234...abcd",
        views: 12,
        partialFills: 0,
      },
      {
        id: "LO002",
        type: "lending",
        usdcAmount: 8000,
        interestRate: 11.5,
        term: 30,
        maxLtv: 80,
        status: "active",
        createdAt: "2024-03-14T16:20:00Z",
        expiresAt: "2024-04-14T16:20:00Z",
        signature: "0x5678...efgh",
        views: 8,
        partialFills: 0,
      },
      {
        id: "LO003",
        type: "lending",
        usdcAmount: 12000,
        interestRate: 14.8,
        term: 180,
        maxLtv: 70,
        status: "paused",
        createdAt: "2024-03-13T12:10:00Z",
        expiresAt: "2024-05-13T12:10:00Z",
        signature: "0x9abc...ijkl",
        views: 25,
        partialFills: 1,
      },
    ],
    borrowing: [
      {
        id: "BO001",
        type: "borrowing",
        usdcAmount: 15000,
        maxInterestRate: 10.5,
        term: 60,
        collateralEth: 6.2,
        status: "active",
        createdAt: "2024-03-16T10:15:00Z",
        expiresAt: "2024-04-16T10:15:00Z",
        signature: "0xdef0...mnop",
        views: 18,
        offers: 3,
      },
    ],
  }

  // Matched Positions (Active loans) - Updated with realistic maturity dates
  const matchedPositions = {
    asLender: [
      {
        id: "ML001",
        orderId: "LO004",
        principal: 15000,
        currentValue: 15234.5,
        borrower: "0x5555...1111",
        borrowerCollateral: 5.5,
        collateralValueUsd: isPriceLoading ? 17600 : 5.5 * ethPrice,
        interestRate: 15.8,
        term: 180,
        startDate: "2024-02-20T11:45:00Z",
        maturityDate: "2024-05-20T11:45:00Z",
        gracePeriodEnd: "2024-05-21T11:45:00Z", // 1 day after maturity
        healthRatio: isPriceLoading ? 92.1 : ((5.5 * ethPrice) / 15234.5) * 100,
        status: "active",
        lastHealthCheck: "2024-03-20T14:30:00Z",
      },
      {
        id: "ML002",
        orderId: "LO005",
        principal: 8000,
        currentValue: 8089.2,
        borrower: "0x7777...8888",
        borrowerCollateral: 3.1,
        collateralValueUsd: isPriceLoading ? 9920 : 3.1 * ethPrice,
        interestRate: 9.5,
        term: 30,
        startDate: "2024-03-26T14:20:00Z",
        maturityDate: "2024-04-25T14:20:00Z",
        gracePeriodEnd: "2024-04-26T14:20:00Z", // 1 day after maturity
        healthRatio: isPriceLoading ? 88.7 : ((3.1 * ethPrice) / 8089.2) * 100,
        status: "at_risk",
        lastHealthCheck: "2024-03-20T14:25:00Z",
      },
    ],
    asBorrower: [
      {
        id: "MB001",
        orderId: "BO002",
        principal: 10000,
        currentDebt: 10156.8,
        lender: "0x1234...5678",
        collateralEth: 4.2,
        collateralValueUsd: isPriceLoading ? 13440 : 4.2 * ethPrice,
        interestRate: 8.5,
        term: 30,
        startDate: "2024-03-02T10:30:00Z",
        maturityDate: "2024-04-01T10:30:00Z",
        gracePeriodEnd: "2024-04-02T10:30:00Z", // 1 day after maturity
        liquidationPrice: isPriceLoading ? 2416 : 10156.8 / 4.2,
        healthRatio: isPriceLoading ? 85.2 : ((4.2 * ethPrice) / 10156.8) * 100,
        status: "liquidated", // Past grace period
        lastHealthCheck: "2024-03-20T14:32:00Z",
      },
      {
        id: "MB002",
        orderId: "BO003",
        principal: 25000,
        currentDebt: 25892.3,
        lender: "0x9876...4321",
        collateralEth: 9.8,
        collateralValueUsd: isPriceLoading ? 31360 : 9.8 * ethPrice,
        interestRate: 12.2,
        term: 90,
        startDate: "2024-02-15T09:15:00Z",
        maturityDate: "2024-03-21T09:15:00Z", // Tomorrow
        gracePeriodEnd: "2024-03-22T09:15:00Z", // Day after tomorrow
        liquidationPrice: isPriceLoading ? 2642 : 25892.3 / 9.8,
        healthRatio: isPriceLoading ? 78.9 : ((9.8 * ethPrice) / 25892.3) * 100,
        status: "critical", // In grace period
        lastHealthCheck: "2024-03-20T14:28:00Z",
      },
    ],
  }

  // Order History
  const orderHistory = [
    {
      id: "H001",
      type: "lending_order_filled",
      orderId: "LO006",
      amount: 5000,
      rate: 7.2,
      term: 30,
      counterparty: "0x9999...aaaa",
      timestamp: "2024-02-28T15:45:00Z",
      status: "completed",
      interestEarned: 89.2,
    },
    {
      id: "H002",
      type: "borrowing_order_filled",
      orderId: "BO004",
      amount: 10000,
      rate: 8.5,
      term: 30,
      counterparty: "0x1234...5678",
      timestamp: "2024-03-02T10:30:00Z",
      status: "active",
      interestOwed: 156.8,
    },
    {
      id: "H003",
      type: "lending_order_cancelled",
      orderId: "LO007",
      amount: 15000,
      rate: 12.0,
      term: 90,
      timestamp: "2024-03-10T09:20:00Z",
      status: "cancelled",
      reason: "Better rate available",
    },
    {
      id: "H004",
      type: "position_liquidated",
      orderId: "BO005",
      amount: 3000,
      collateral: 1.2,
      liquidationPrice: 2500,
      timestamp: "2024-02-25T09:20:00Z",
      status: "liquidated",
      collateralLoss: 45.2,
    },
  ]

  // Portfolio Analytics
  const portfolioStats = {
    totalLent: matchedPositions.asLender.reduce((sum, pos) => sum + pos.principal, 0),
    totalBorrowed: matchedPositions.asBorrower.reduce((sum, pos) => sum + pos.principal, 0),
    totalCollateral: matchedPositions.asBorrower.reduce((sum, pos) => sum + pos.collateralEth, 0),
    activeOrders: activeOrders.lending.length + activeOrders.borrowing.length,
    matchedPositions: matchedPositions.asLender.length + matchedPositions.asBorrower.length,
    totalInterestEarned: matchedPositions.asLender.reduce((sum, pos) => sum + (pos.currentValue - pos.principal), 0),
    totalInterestOwed: matchedPositions.asBorrower.reduce((sum, pos) => sum + (pos.currentDebt - pos.principal), 0),
    utilizationRate:
      activeOrders.lending.length > 0
        ? (matchedPositions.asLender.length / (matchedPositions.asLender.length + activeOrders.lending.length)) * 100
        : 0,
    avgLendingRate:
      matchedPositions.asLender.length > 0
        ? matchedPositions.asLender.reduce((sum, pos) => sum + pos.interestRate, 0) / matchedPositions.asLender.length
        : 0,
    avgBorrowingRate:
      matchedPositions.asBorrower.length > 0
        ? matchedPositions.asBorrower.reduce((sum, pos) => sum + pos.interestRate, 0) /
          matchedPositions.asBorrower.length
        : 0,
  }

  const getHealthColor = (healthRatio) => {
    if (healthRatio >= 150) return "text-green-600"
    if (healthRatio >= 120) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthBadgeVariant = (healthRatio) => {
    if (healthRatio >= 150) return "default"
    if (healthRatio >= 120) return "secondary"
    return "destructive"
  }

  const getStatusBadge = (status) => {
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

  const formatTimeRemaining = (dateString) => {
    const maturity = new Date(dateString)
    const now = new Date()
    const diffTime = maturity - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "Expired"
    if (diffDays === 1) return "1 day"
    return `${diffDays} days`
  }

  const getGracePeriodCountdown = (gracePeriodEnd) => {
    const now = currentTime
    const graceEnd = new Date(gracePeriodEnd)
    const diffTime = graceEnd - now

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

  const getMaturityStatus = (maturityDate, gracePeriodEnd) => {
    const now = currentTime
    const maturity = new Date(maturityDate)
    const graceEnd = new Date(gracePeriodEnd)

    if (now > graceEnd) return "liquidated"
    if (now > maturity) return "grace_period"

    const timeToMaturity = maturity - now
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
                {activeOrders.lending.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active lending orders</p>
                    <p className="text-sm">Create offers in the Market tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.lending.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-lg">${order.usdcAmount.toLocaleString()} USDC</div>
                            <div className="text-sm text-muted-foreground">
                              {order.interestRate}% APR • {order.term}D • Max LTV {order.maxLtv}%
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(order.status)}</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Expires</div>
                            <div className="font-medium">{formatTimeRemaining(order.expiresAt)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Views</div>
                            <div className="font-medium">{order.views}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Partial Fills</div>
                            <div className="font-medium">{order.partialFills}</div>
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
                {activeOrders.borrowing.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active borrowing orders</p>
                    <p className="text-sm">Create borrowing requests in the Market tab</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.borrowing.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-lg">${order.usdcAmount.toLocaleString()} USDC</div>
                            <div className="text-sm text-muted-foreground">
                              Max {order.maxInterestRate}% APR • {order.term}D • {order.collateralEth} ETH collateral
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(order.status)}</div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Expires</div>
                            <div className="font-medium">{formatTimeRemaining(order.expiresAt)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Views</div>
                            <div className="font-medium">{order.views}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Offers Received</div>
                            <div className="font-medium">{order.offers}</div>
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
            {/* Lending Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Active Lending Positions
                </CardTitle>
                <CardDescription>USDC lent out and earning interest</CardDescription>
              </CardHeader>
              <CardContent>
                {matchedPositions.asLender.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active lending positions</p>
                    <p className="text-sm">Your orders haven't been matched yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchedPositions.asLender.map((position) => (
                      <div key={position.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-lg">${position.currentValue.toLocaleString()} USDC</div>
                            <div className="text-sm text-muted-foreground">
                              Principal: ${position.principal.toLocaleString()} • {position.interestRate}% APR •{" "}
                              {position.term}D
                            </div>
                          </div>
                          <Badge variant={getHealthBadgeVariant(position.healthRatio)}>
                            Health: {position.healthRatio.toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Borrower's Collateral</div>
                            <div className="font-medium">{position.borrowerCollateral} ETH</div>
                            <div className="text-xs text-muted-foreground">
                              {isPriceLoading ? (
                                <div className="animate-pulse bg-muted rounded h-3 w-16" />
                              ) : (
                                `$${position.collateralValueUsd.toLocaleString()}`
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Maturity</div>
                            <div className="font-medium flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {formatTimeRemaining(position.maturityDate)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Interest Earned</div>
                            <div className="font-medium text-green-600">
                              +${(position.currentValue - position.principal).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Borrower</div>
                            <div className="font-mono text-xs">{position.borrower}</div>
                          </div>
                        </div>

                        {/* Health Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Collateral Health</span>
                            <span className={getHealthColor(position.healthRatio)}>
                              {position.healthRatio.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={Math.min(position.healthRatio, 200)} className="h-2" />
                        </div>

                        {position.status === "at_risk" && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              ⚠️ Borrower's position is at risk. Monitor closely for liquidation opportunity.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            Monitor
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Borrowing Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  Active Borrowing Positions
                </CardTitle>
                <CardDescription>⚠️ Critical: Only 24 hours to repay after maturity!</CardDescription>
              </CardHeader>
              <CardContent>
                {matchedPositions.asBorrower.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active borrowing positions</p>
                    <p className="text-sm">Your borrowing orders haven't been matched yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchedPositions.asBorrower.map((position) => {
                      const maturityStatus = getMaturityStatus(position.maturityDate, position.gracePeriodEnd)
                      const gracePeriodCountdown = getGracePeriodCountdown(position.gracePeriodEnd)

                      return (
                        <div
                          key={position.id}
                          className={`border rounded-lg p-4 space-y-4 ${
                            maturityStatus === "critical" || maturityStatus === "grace_period"
                              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                              : maturityStatus === "warning"
                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                                : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-lg">${position.currentDebt.toLocaleString()} USDC</div>
                              <div className="text-sm text-muted-foreground">
                                Principal: ${position.principal.toLocaleString()} • {position.interestRate}% APR •{" "}
                                {position.term}D
                              </div>
                            </div>
                            {getStatusBadge(
                              maturityStatus === "liquidated"
                                ? "liquidated"
                                : maturityStatus === "grace_period"
                                  ? "critical"
                                  : position.status,
                            )}
                          </div>

                          {/* URGENT COUNTDOWN for grace period */}
                          {maturityStatus === "grace_period" && !gracePeriodCountdown.expired && (
                            <Alert variant="destructive" className="border-red-600 bg-red-100 dark:bg-red-950">
                              <AlertCircle className="h-4 w-4 animate-pulse" />
                              <AlertDescription className="font-bold">
                                🚨 GRACE PERIOD: {gracePeriodCountdown.text} TO REPAY OR LOSE ALL COLLATERAL!
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Critical warning approaching maturity */}
                          {maturityStatus === "critical" && (
                            <Alert variant="destructive" className="border-orange-600 bg-orange-100 dark:bg-orange-950">
                              <Clock className="h-4 w-4" />
                              <AlertDescription className="font-semibold">
                                ⚠️ LOAN MATURES IN LESS THAN 24 HOURS! Prepare to repay immediately.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Your Collateral</div>
                              <div className="font-medium">{position.collateralEth} ETH</div>
                              <div className="text-xs text-muted-foreground">
                                {isPriceLoading ? (
                                  <div className="animate-pulse bg-muted rounded h-3 w-16" />
                                ) : (
                                  `$${position.collateralValueUsd.toLocaleString()}`
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                {maturityStatus === "grace_period" ? "Grace Period Ends" : "Maturity"}
                              </div>
                              <div className="font-medium flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {maturityStatus === "grace_period"
                                  ? gracePeriodCountdown.text
                                  : formatTimeRemaining(position.maturityDate)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Liquidation Price</div>
                              <div className="font-medium">${position.liquidationPrice.toFixed(0)}</div>
                              <div className="text-xs text-muted-foreground">
                                Current: {isPriceLoading ? "..." : `$${ethPrice.toLocaleString()}`}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Lender</div>
                              <div className="font-mono text-xs">{position.lender}</div>
                            </div>
                          </div>

                          {/* Health Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Position Health</span>
                              <span className={getHealthColor(position.healthRatio)}>
                                {position.healthRatio.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={Math.min(position.healthRatio, 200)} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Liquidation (100%)</span>
                              <span>Safe (150%+)</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {maturityStatus === "liquidated" ? (
                              <Button size="sm" className="flex-1" disabled variant="destructive">
                                LIQUIDATED - Collateral Lost
                              </Button>
                            ) : maturityStatus === "grace_period" ? (
                              <Button size="sm" className="flex-1 animate-pulse" variant="destructive">
                                🚨 REPAY NOW ({gracePeriodCountdown.text} LEFT)
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="flex-1"
                                variant={maturityStatus === "critical" ? "destructive" : "default"}
                              >
                                {maturityStatus === "critical"
                                  ? "⚠️ REPAY URGENTLY"
                                  : `Repay Loan (${formatTimeRemaining(position.maturityDate)} to maturity)`}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
