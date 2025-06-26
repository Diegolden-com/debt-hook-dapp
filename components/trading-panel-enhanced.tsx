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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TrendingUp, TrendingDown, Info, AlertTriangle, Wallet, DollarSign, Zap, Clock, Users } from "lucide-react"
import { useEthPrice } from "@/hooks/use-eth-price"
import { usePrivyWallet } from "@/hooks/use-privy-wallet"
import { usePrivy } from "@privy-io/react-auth"
import { useDebtOrderBook } from "@/lib/hooks/contracts"
import { useEnhancedDebtOrderBook } from "@/lib/hooks/contracts/useEnhancedDebtOrderBook"
import { useGaslessTransaction } from "@/hooks/use-gasless-transaction"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { BatchStatusIndicator } from "@/components/batch-status-indicator"

interface TradingPanelProps {
  bestBid: number
  bestAsk: number
  onCreateOrder: (orderData: any) => Promise<void>
  onTakeOrder?: (orderData: any) => void
}

type ExecutionMode = 'direct' | 'batch'

export function EnhancedTradingPanel({ bestBid, bestAsk, onCreateOrder, onTakeOrder }: TradingPanelProps) {
  const [activeTab, setActiveTab] = useState("lend")
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("direct")
  const { price: ethPrice, isLoading: isPriceLoading } = useEthPrice()
  const { address, isConnected } = usePrivyWallet()
  const { login } = usePrivy()
  const { signLoanOrder } = useDebtOrderBook()
  const { submitOrderToAVS, submitBorrowerOrderToAVS, isSubmitting, serviceManager } = useEnhancedDebtOrderBook()
  const { checkUSDCBalance } = useGaslessTransaction()
  
  // Gasless transaction state
  const [useUSDCForGas, setUseUSDCForGas] = useState(false)

  // Lending form state
  const [lendingForm, setLendingForm] = useState({
    usdcAmount: "",
    interestRate: "",
    term: "30",
    maxLtv: "75",
    // Batch-specific fields
    minPrincipal: "",
    maxPrincipal: "",
    minRate: "",
    maxRate: ""
  })

  // Borrowing form state
  const [borrowingForm, setBorrowingForm] = useState({
    usdcAmount: "",
    maxInterestRate: "",
    term: "30",
    collateralEth: "",
    // Batch-specific fields
    minPrincipal: "",
    maxPrincipal: ""
  })

  const isBatchAvailable = serviceManager && serviceManager !== '0x0000000000000000000000000000000000000000'

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
    if (collateralValue === 0) return "0"
    return ((loanValue / collateralValue) * 100).toFixed(1)
  }

  const handleLendingSubmit = async () => {
    if (!isConnected || !address) {
      login()
      return
    }
    
    try {
      // Convert form values to contract format
      const loanAmount = parseUnits(lendingForm.usdcAmount, 6)
      const requiredEth = calculateRequiredEth(lendingForm.usdcAmount, lendingForm.maxLtv)
      const collateralAmount = parseUnits(requiredEth, 18)
      const interestRate = BigInt(Math.floor(Number.parseFloat(lendingForm.interestRate) * 100))
      const duration = BigInt(Number.parseInt(lendingForm.term) * 24 * 60 * 60)
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60)
      
      // Sign the order
      const signedOrder = await signLoanOrder({
        lender: address,
        collateralAmount,
        loanAmount,
        interestRate,
        duration,
        expiry,
      })
      
      if (!signedOrder) {
        toast.error("Failed to sign order")
        return
      }

      if (executionMode === 'direct') {
        // Direct execution - existing flow
        const hasEnoughUSDC = await checkUSDCBalance(loanAmount)
        if (!hasEnoughUSDC) {
          toast.error("Insufficient USDC balance")
          return
        }

        await onCreateOrder({
          ...signedOrder,
          term: lendingForm.term,
          rate: lendingForm.interestRate,
          amount: lendingForm.usdcAmount,
          ltv: lendingForm.maxLtv,
          useGaslessTransaction: useUSDCForGas,
        })
        
        toast.success("Lending offer created successfully!")
      } else {
        // Batch execution - submit to AVS
        await submitOrderToAVS(signedOrder, {
          minPrincipal: parseUnits(lendingForm.minPrincipal || lendingForm.usdcAmount, 6),
          maxPrincipal: parseUnits(lendingForm.maxPrincipal || lendingForm.usdcAmount, 6),
          minRate: BigInt(Math.round(Number(lendingForm.minRate || lendingForm.interestRate) * 100)),
          maxRate: BigInt(Math.round(Number(lendingForm.maxRate || lendingForm.interestRate) * 100))
        })
        
        toast.success("Order submitted to batch matching!")
      }

      // Reset form
      setLendingForm({
        usdcAmount: "",
        interestRate: "",
        term: "30",
        maxLtv: "75",
        minPrincipal: "",
        maxPrincipal: "",
        minRate: "",
        maxRate: ""
      })
    } catch (error) {
      console.error("Error creating lending order:", error)
      toast.error("Failed to create lending offer")
    }
  }

  const handleBorrowingSubmit = async () => {
    if (!isConnected || !address) {
      login()
      return
    }

    try {
      if (executionMode === 'direct') {
        // Direct execution - create a borrowing request
        await onCreateOrder({
          type: "borrow",
          amount: borrowingForm.usdcAmount,
          maxRate: borrowingForm.maxInterestRate,
          term: borrowingForm.term,
          collateral: borrowingForm.collateralEth,
        })
        
        toast.success("Borrowing request created!")
      } else {
        // Batch execution - submit borrower order to AVS
        const principalAmount = parseUnits(borrowingForm.usdcAmount, 6)
        const collateralAmount = parseUnits(borrowingForm.collateralEth, 18)
        const maxInterestRateBips = BigInt(Math.round(Number(borrowingForm.maxInterestRate) * 100))
        const maturityTimestamp = BigInt(Math.floor(Date.now() / 1000) + Number(borrowingForm.term) * 24 * 60 * 60)
        const expiry = BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60)
        
        await submitBorrowerOrderToAVS({
          principalAmount,
          maxInterestRateBips,
          maturityTimestamp,
          collateralAmount,
          minPrincipal: parseUnits(borrowingForm.minPrincipal || borrowingForm.usdcAmount, 6),
          maxPrincipal: parseUnits(borrowingForm.maxPrincipal || borrowingForm.usdcAmount, 6),
          expiry
        })
        
        toast.success("Borrowing request submitted to batch matching!")
      }

      // Reset form
      setBorrowingForm({
        usdcAmount: "",
        maxInterestRate: "",
        term: "30",
        collateralEth: "",
        minPrincipal: "",
        maxPrincipal: ""
      })
    } catch (error) {
      console.error("Error creating borrowing order:", error)
      toast.error("Failed to create borrowing request")
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
        {/* Execution Mode Selection */}
        <div className="mb-4 space-y-3">
          <Label>Execution Mode</Label>
          <RadioGroup value={executionMode} onValueChange={(value) => setExecutionMode(value as ExecutionMode)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Direct</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Instant execution</p>
                </Label>
              </div>
              
              <div className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${isBatchAvailable ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'}`}>
                <RadioGroupItem value="batch" id="batch" disabled={!isBatchAvailable} />
                <Label htmlFor="batch" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Batch</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Better rates via CoW</p>
                </Label>
              </div>
            </div>
          </RadioGroup>
          {!isBatchAvailable && (
            <p className="text-xs text-muted-foreground">Batch matching is not available at this time</p>
          )}
        </div>

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
                  onChange={(e) => setLendingForm({ ...lendingForm, usdcAmount: e.target.value })}
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
                    onChange={(e) => setLendingForm({ ...lendingForm, interestRate: e.target.value })}
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
              </div>

              {/* Batch-specific fields */}
              {executionMode === 'batch' && (
                <>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your order will be matched in the next batch round (~5 min). You can specify flexible parameters below.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="min-principal">Min Principal (USDC)</Label>
                      <Input
                        id="min-principal"
                        type="number"
                        placeholder={(Number(lendingForm.usdcAmount) * 0.8).toFixed(2) || "8000"}
                        value={lendingForm.minPrincipal}
                        onChange={(e) => setLendingForm({ ...lendingForm, minPrincipal: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-principal">Max Principal (USDC)</Label>
                      <Input
                        id="max-principal"
                        type="number"
                        placeholder={(Number(lendingForm.usdcAmount) * 1.2).toFixed(2) || "12000"}
                        value={lendingForm.maxPrincipal}
                        onChange={(e) => setLendingForm({ ...lendingForm, maxPrincipal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="min-rate">Min Rate (%)</Label>
                      <Input
                        id="min-rate"
                        type="number"
                        placeholder={(Number(lendingForm.interestRate) - 0.5).toFixed(1) || "8.0"}
                        value={lendingForm.minRate}
                        onChange={(e) => setLendingForm({ ...lendingForm, minRate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-rate">Max Rate (%)</Label>
                      <Input
                        id="max-rate"
                        type="number"
                        placeholder={(Number(lendingForm.interestRate) + 0.5).toFixed(1) || "9.0"}
                        value={lendingForm.maxRate}
                        onChange={(e) => setLendingForm({ ...lendingForm, maxRate: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

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
                    onChange={(e) => setLendingForm({ ...lendingForm, maxLtv: e.target.value })}
                  />
                </div>
              </div>

              {/* Gasless transaction option (only for direct mode) */}
              {executionMode === 'direct' && (
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <Label htmlFor="gasless-switch" className="text-sm font-medium cursor-pointer">
                        Pay gas fees with USDC
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        No ETH needed - gas paid from your USDC balance
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="gasless-switch"
                    checked={useUSDCForGas}
                    onCheckedChange={setUseUSDCForGas}
                  />
                </div>
              )}

              <Button 
                onClick={handleLendingSubmit} 
                className="w-full" 
                disabled={!isLendingFormValid || isPriceLoading || isSubmitting}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {isConnected 
                  ? isSubmitting 
                    ? "Submitting..." 
                    : executionMode === 'batch' 
                      ? "Submit to Batch" 
                      : "Create Lending Offer" 
                  : "Connect Wallet"}
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
                    setBorrowingForm({ ...borrowingForm, usdcAmount: value })
                    if (value && !isPriceLoading && ethPrice) {
                      const requiredEth = calculateRequiredEth(value, "75")
                      setBorrowingForm((prev) => ({ ...prev, collateralEth: requiredEth }))
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="borrow-rate">Max Interest Rate (APR %)</Label>
                <Input
                  id="borrow-rate"
                  type="number"
                  placeholder="9.0"
                  min="0"
                  step="0.1"
                  value={borrowingForm.maxInterestRate}
                  onChange={(e) => setBorrowingForm({ ...borrowingForm, maxInterestRate: e.target.value })}
                />
              </div>

              {/* Batch-specific fields for borrowing */}
              {executionMode === 'batch' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="borrow-min-principal">Min Amount (USDC)</Label>
                    <Input
                      id="borrow-min-principal"
                      type="number"
                      placeholder={(Number(borrowingForm.usdcAmount) * 0.8).toFixed(2) || "8000"}
                      value={borrowingForm.minPrincipal}
                      onChange={(e) => setBorrowingForm({ ...borrowingForm, minPrincipal: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="borrow-max-principal">Max Amount (USDC)</Label>
                    <Input
                      id="borrow-max-principal"
                      type="number"
                      placeholder={(Number(borrowingForm.usdcAmount) * 1.2).toFixed(2) || "12000"}
                      value={borrowingForm.maxPrincipal}
                      onChange={(e) => setBorrowingForm({ ...borrowingForm, maxPrincipal: e.target.value })}
                    />
                  </div>
                </div>
              )}

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
                    onChange={(e) => setBorrowingForm({ ...borrowingForm, collateralEth: e.target.value })}
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your ETH collateral will be locked until loan repayment. Monitor your position to avoid liquidation.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleBorrowingSubmit}
                className="w-full"
                disabled={!isBorrowingFormValid || isPriceLoading || isSubmitting}
                variant="outline"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isConnected 
                  ? isSubmitting 
                    ? "Submitting..." 
                    : executionMode === 'batch' 
                      ? "Submit to Batch" 
                      : "Create Borrowing Request" 
                  : "Connect Wallet"}
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
                  `$${ethPrice.toLocaleString()}`
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