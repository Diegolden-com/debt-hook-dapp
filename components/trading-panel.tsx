"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Info, AlertTriangle, Wallet, DollarSign, Zap } from "lucide-react" // Added Zap icon
import { useEthPrice } from "@/hooks/use-eth-price"

interface TradingPanelProps {
  bestBid: number
  bestAsk: number
  onCreateOrder: (orderData: any) => Promise<void>
  onTakeOrder?: (orderData: any) => void
}

export function TradingPanel({ bestBid, bestAsk, onCreateOrder, onTakeOrder }: TradingPanelProps) {
  const [activeTab, setActiveTab] = useState("lend")
  const { price: ethPrice, isLoading: isPriceLoading } = useEthPrice()

  // Lending form state
  const [lendingForm, setLendingForm] = useState({
    usdcAmount: "",
    interestRate: "",
    term: "30",
    maxLtv: "75",
  })

  // Borrowing form state
  const [borrowingForm, setBorrowingForm] = useState({
    usdcAmount: "",
    maxInterestRate: "",
    term: "30",
    collateralEth: "",
  })

  const calculateRequiredEth = (usdcAmount: string, ltv: string) => {
    if (!usdcAmount || !ltv || isPriceLoading || !ethPrice) return "0"
    const loanValue = Number.parseFloat(usdcAmount)
    const ltvRatio = Number.parseFloat(ltv) / 100
    const collateralValue = loanValue / ltvRatio
    return (collateralValue / ethPrice).toFixed(4)
  }

  const calculateLTV = (usdcAmount: string, ethAmount: string) => {
    if (!usdcAmount || !ethAmount || isPriceLoading || !ethPrice) return "0"
    const loanValue = Number.parseFloat(usdcAmount)
    const collateralValue = Number.parseFloat(ethAmount) * ethPrice
    if (collateralValue === 0) return "0" // Avoid division by zero
    return ((loanValue / collateralValue) * 100).toFixed(1)
  }

  const handleLendingSubmit = async () => {
    try {
      const orderData = {
        type: "bid" as const,
        rate: Number.parseFloat(lendingForm.interestRate),
        amount: Number.parseInt(lendingForm.usdcAmount),
        term: Number.parseInt(lendingForm.term),
        lender: "0x1234567890123456789012345678901234567890", // Replace with actual wallet
        max_ltv: Number.parseInt(lendingForm.maxLtv),
        status: "active" as const,
      }
      await onCreateOrder(orderData)
      setLendingForm({ usdcAmount: "", interestRate: "", term: "30", maxLtv: "75" })
    } catch (error) {
      console.error("Error creating lending order:", error)
    }
  }

  const handleBorrowingSubmit = async () => {
    try {
      const orderData = {
        type: "ask" as const,
        rate: Number.parseFloat(borrowingForm.maxInterestRate),
        amount: Number.parseInt(borrowingForm.usdcAmount),
        term: Number.parseInt(borrowingForm.term),
        borrower: "0x1234567890123456789012345678901234567890", // Replace with actual wallet
        status: "active" as const,
      }
      await onCreateOrder(orderData)
      setBorrowingForm({ usdcAmount: "", maxInterestRate: "", term: "30", collateralEth: "" })
    } catch (error) {
      console.error("Error creating borrowing order:", error)
    }
  }

  const isLendingFormValid = lendingForm.usdcAmount && lendingForm.interestRate && lendingForm.maxLtv
  const isBorrowingFormValid = borrowingForm.usdcAmount && borrowingForm.maxInterestRate && borrowingForm.collateralEth

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Trading Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lend" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lend
            </TabsTrigger>
            <TabsTrigger value="borrow" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Borrow
            </TabsTrigger>
          </TabsList>

          {/* LENDING TAB */}
          <TabsContent value="lend" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="lend-amount">USDC Amount to Lend</Label>
                <Input
                  id="lend-amount"
                  type="number"
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  value={lendingForm.usdcAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || (Number.parseFloat(value) >= 0 && !isNaN(Number.parseFloat(value)))) {
                      setLendingForm({ ...lendingForm, usdcAmount: value })
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="lend-rate">Interest Rate (APR %)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="lend-rate"
                    type="number"
                    placeholder="8.5"
                    min="0"
                    step="0.1"
                    value={lendingForm.interestRate}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || (Number.parseFloat(value) >= 0 && !isNaN(Number.parseFloat(value)))) {
                        setLendingForm({ ...lendingForm, interestRate: value })
                      }
                    }}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (bestBid > 0) {
                        setLendingForm({ ...lendingForm, interestRate: bestBid.toFixed(1) })
                      }
                    }}
                    disabled={!bestBid || bestBid <= 0}
                    className="px-3"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Market
                  </Button>
                </div>
                {bestBid > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Best current lending rate (bid):{" "}
                    <span className="text-green-600 font-medium">{bestBid.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lend-term">Term</Label>
                  <Select
                    value={lendingForm.term}
                    onValueChange={(value) => setLendingForm({ ...lendingForm, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lend-ltv">Max LTV (%)</Label>
                  <Input
                    id="lend-ltv"
                    type="number"
                    placeholder="75"
                    min="0"
                    max="90"
                    step="1"
                    value={lendingForm.maxLtv}
                    onChange={(e) => {
                      const value = e.target.value
                      if (
                        value === "" ||
                        (Number.parseFloat(value) >= 0 &&
                          Number.parseFloat(value) <= 90 &&
                          !isNaN(Number.parseFloat(value)))
                      ) {
                        setLendingForm({ ...lendingForm, maxLtv: value })
                      }
                    }}
                  />
                </div>
              </div>

              {lendingForm.usdcAmount && lendingForm.maxLtv && !isPriceLoading && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Loan Requirements</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Borrower needs:</span>
                      <span className="font-medium text-green-800 dark:text-green-200">
                        {calculateRequiredEth(lendingForm.usdcAmount, lendingForm.maxLtv)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Collateral value:</span>
                      <span className="font-medium text-green-800 dark:text-green-200">
                        $
                        {(
                          Number.parseFloat(lendingForm.usdcAmount) /
                          (Number.parseFloat(lendingForm.maxLtv) / 100)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">ETH price:</span>
                      <span className="font-medium text-green-800 dark:text-green-200">
                        ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your lending offer will be visible to all users. You'll earn interest when someone borrows against it.
                </AlertDescription>
              </Alert>

              <Button onClick={handleLendingSubmit} className="w-full" disabled={!isLendingFormValid || isPriceLoading}>
                <DollarSign className="mr-2 h-4 w-4" />
                Create Lending Offer
              </Button>
            </div>
          </TabsContent>

          {/* BORROWING TAB */}
          <TabsContent value="borrow" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="borrow-amount">USDC Amount to Borrow</Label>
                <Input
                  id="borrow-amount"
                  type="number"
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  value={borrowingForm.usdcAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || (Number.parseFloat(value) >= 0 && !isNaN(Number.parseFloat(value)))) {
                      setBorrowingForm({ ...borrowingForm, usdcAmount: value })
                      if (value && !isPriceLoading && ethPrice) {
                        const requiredEth = calculateRequiredEth(value, "75") // Default LTV for calculation
                        setBorrowingForm((prev) => ({ ...prev, collateralEth: requiredEth }))
                      }
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="borrow-rate">Max Interest Rate (APR %)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="borrow-rate"
                    type="number"
                    placeholder="9.0"
                    min="0"
                    step="0.1"
                    value={borrowingForm.maxInterestRate}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || (Number.parseFloat(value) >= 0 && !isNaN(Number.parseFloat(value)))) {
                        setBorrowingForm({ ...borrowingForm, maxInterestRate: value })
                      }
                    }}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (bestAsk > 0) {
                        setBorrowingForm({ ...borrowingForm, maxInterestRate: bestAsk.toFixed(1) })
                      }
                    }}
                    disabled={!bestAsk || bestAsk <= 0}
                    className="px-3"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Market
                  </Button>
                </div>
                {bestAsk > 0 && ( // Corrected to use bestAsk for borrowing hint
                  <div className="text-xs text-muted-foreground mt-1">
                    Best available borrowing rate (ask):{" "}
                    <span className="text-red-600 font-medium">{bestAsk.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="borrow-term">Term</Label>
                  <Select
                    value={borrowingForm.term}
                    onValueChange={(value) => setBorrowingForm({ ...borrowingForm, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="borrow-collateral">ETH Collateral</Label>
                  <Input
                    id="borrow-collateral"
                    type="number"
                    placeholder="4.2"
                    min="0"
                    step="0.001"
                    value={borrowingForm.collateralEth}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || (Number.parseFloat(value) >= 0 && !isNaN(Number.parseFloat(value)))) {
                        setBorrowingForm({ ...borrowingForm, collateralEth: value })
                      }
                    }}
                  />
                </div>
              </div>

              {borrowingForm.usdcAmount && borrowingForm.collateralEth && !isPriceLoading && ethPrice > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Position Details</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">LTV Ratio:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        {calculateLTV(borrowingForm.usdcAmount, borrowingForm.collateralEth)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Collateral value:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        $
                        {(Number.parseFloat(borrowingForm.collateralEth) * ethPrice).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Liquidation price:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        $
                        {(
                          Number.parseFloat(borrowingForm.usdcAmount) / Number.parseFloat(borrowingForm.collateralEth)
                        ).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Current ETH price:</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your ETH collateral will be locked until loan repayment. Monitor your position to avoid liquidation.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleBorrowingSubmit}
                className="w-full"
                disabled={!isBorrowingFormValid || isPriceLoading}
                variant="outline"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Create Borrowing Request
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        {/* Market Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Market Info</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Best Bid (Lend at)</div>
              <div className="font-medium text-green-600">{bestBid > 0 ? `${bestBid.toFixed(1)}%` : "N/A"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Best Ask (Borrow at)</div>
              <div className="font-medium text-red-600">{bestAsk > 0 ? `${bestAsk.toFixed(1)}%` : "N/A"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">ETH Price</div>
              <div className="font-medium">
                {isPriceLoading ? (
                  <div className="animate-pulse bg-muted rounded h-4 w-16" />
                ) : (
                  `$${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Spread</div>
              <div className="font-medium">
                {bestBid > 0 && bestAsk > 0 ? `${(bestAsk - bestBid).toFixed(1)}%` : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
