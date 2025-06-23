"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { EthPriceDisplay } from "@/components/eth-price-display"
import { OrderBook } from "@/components/order-book"
import { TradingPanel } from "@/components/trading-panel"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { useEthPrice } from "@/hooks/use-eth-price"
import { useRealtimeOrderbook } from "@/hooks/use-realtime-orderbook"
import { useDebtOrderBook, type SignedLoanOrder } from "@/lib/hooks/contracts"
import { toast } from "sonner"
import type { Address } from "viem"

export default function MarketPage() {
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const { price: ethPrice, isLoading: isPriceLoading } = useEthPrice()
  const { execute, isExecuting } = useDebtOrderBook()

  // Use a default term for the trading panel, but the OrderBook manages its own term
  const { bestBid, bestAsk, createOrder, fillOrder } = useRealtimeOrderbook("30") // Default to 30 days for trading panel

  const calculateRequiredEth = (usdcAmount: string, ltv: string) => {
    if (!usdcAmount || !ltv || isPriceLoading || !ethPrice) return 0
    const loanValue = Number.parseFloat(usdcAmount)
    const ltvRatio = Number.parseFloat(ltv) / 100
    const collateralValue = loanValue / ltvRatio
    return (collateralValue / ethPrice).toFixed(4)
  }

  const handleTakeOffer = async (offer: any) => {
    if (!offer.signature) {
      toast.error("This offer is missing a signature")
      return
    }

    try {
      // Reconstruct the signed order from the database
      const signedOrder: SignedLoanOrder = {
        lender: offer.lender as Address,
        collateralAmount: BigInt(offer.collateral_amount),
        loanAmount: BigInt(offer.loan_amount),
        interestRate: BigInt(offer.interest_rate_bps),
        duration: BigInt(offer.duration_seconds),
        expiry: BigInt(offer.expiry_timestamp),
        nonce: BigInt(offer.nonce),
        signature: offer.signature as `0x${string}`,
      }

      // Execute the order on-chain
      await execute(signedOrder)
      
      // Update order status in database
      await fillOrder(offer.id)
      
      toast.success("Loan successfully created!")
      setSelectedOffer(null)
    } catch (error) {
      console.error("Error taking offer:", error)
      toast.error("Failed to execute offer")
    }
  }

  const handleCreateOrder = async (orderData: any) => {
    await createOrder(orderData)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* ETH Price Display - Prominent */}
        <div className="mb-8">
          <EthPriceDisplay />
        </div>

        {/* Market Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">ETH/USDC Debt Market</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Real-time order book for collateralized lending</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Live Market Data</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Integrated Order Book with Chart */}
          <div className="lg:col-span-3">
            <OrderBook onOrderSelect={setSelectedOffer} />
          </div>

          {/* Unified Trading Panel */}
          <div>
            <TradingPanel
              bestBid={bestBid}
              bestAsk={bestAsk}
              onCreateOrder={handleCreateOrder}
              onTakeOrder={handleTakeOffer}
            />
          </div>
        </div>

        {/* Order Confirmation Dialog */}
        {selectedOffer && (
          <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Take Lending Offer</DialogTitle>
                <DialogDescription>Review terms and deposit collateral</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Loan Terms</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>You&apos;ll receive:</span>
                      <span className="font-medium">${selectedOffer.amount.toLocaleString()} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest rate:</span>
                      <span className="font-medium">{selectedOffer.rate}% APR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Term:</span>
                      <span className="font-medium">{selectedOffer.term} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ETH collateral required:</span>
                      <span className="font-medium">
                        {calculateRequiredEth(selectedOffer.amount.toString(), "75")} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ETH price:</span>
                      <span className="font-medium">${ethPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total repayment:</span>
                      <span className="font-medium">
                        $
                        {(
                          selectedOffer.amount *
                          (1 + ((selectedOffer.rate / 100) * Number.parseInt(selectedOffer.term)) / 365)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your ETH collateral will be locked until loan maturity. Monitor your position to avoid liquidation.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => handleTakeOffer(selectedOffer)}
                  className="w-full"
                  size="lg"
                  disabled={isPriceLoading || isExecuting}
                >
                  {isExecuting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm & Deposit Collateral
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
