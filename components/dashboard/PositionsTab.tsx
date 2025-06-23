'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  DollarSign,
  ExternalLink,
  Activity,
  Timer,
  Wallet,
} from "lucide-react"
import { formatUnits, formatEther } from "viem"
import type { EnrichedLoan } from "@/lib/hooks/contracts/useUserPositions"

interface PositionsTabProps {
  borrowerPositions: EnrichedLoan[]
  lenderPositions: EnrichedLoan[]
  ethPrice: number
  isLoading: boolean
  onRepay: (loanId: bigint, amount: bigint) => Promise<void>
  onLiquidate: (loanId: bigint) => Promise<void>
  isRepaying: boolean
  isLiquidating: boolean
}

export function PositionsTab({
  borrowerPositions,
  lenderPositions,
  ethPrice,
  isLoading,
  onRepay,
  onLiquidate,
  isRepaying,
  isLiquidating,
}: PositionsTabProps) {
  const getHealthColor = (healthFactor: bigint) => {
    const factor = Number(healthFactor) / 100
    if (factor >= 1.5) return "text-green-600"
    if (factor >= 1.2) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthBadgeVariant = (healthFactor: bigint) => {
    const factor = Number(healthFactor) / 100
    if (factor >= 1.5) return "default"
    if (factor >= 1.2) return "secondary"
    return "destructive"
  }

  const formatTimeRemaining = (remainingDays: number) => {
    if (remainingDays <= 0) return "Matured"
    if (remainingDays === 1) return "1 day"
    return `${remainingDays} days`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">Loading positions...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          {lenderPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active lending positions</p>
              <p className="text-sm">Your orders haven&apos;t been matched yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lenderPositions.map((position) => {
                const principal = Number(formatUnits(position.loanAmount, 6))
                const currentValue = Number(formatUnits(position.currentDebt, 6))
                const collateralValue = Number(formatEther(position.collateralAmount)) * ethPrice
                const healthRatio = (collateralValue / currentValue) * 100

                return (
                  <div key={position.id.toString()} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">${currentValue.toLocaleString()} USDC</div>
                        <div className="text-sm text-muted-foreground">
                          Principal: ${principal.toLocaleString()} • {Number(position.interestRate) / 100}% APR •{" "}
                          {Math.floor(Number(position.duration) / (24 * 60 * 60))}D
                        </div>
                      </div>
                      <Badge variant={getHealthBadgeVariant(BigInt(Math.floor(healthRatio * 100)))}>
                        Health: {healthRatio.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Borrower&apos;s Collateral</div>
                        <div className="font-medium">{formatEther(position.collateralAmount)} ETH</div>
                        <div className="text-xs text-muted-foreground">
                          ${collateralValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Maturity</div>
                        <div className="font-medium flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatTimeRemaining(position.remainingDays)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Interest Earned</div>
                        <div className="font-medium text-green-600">
                          +${(currentValue - principal).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Borrower</div>
                        <div className="font-mono text-xs">{position.borrower.slice(0, 6)}...{position.borrower.slice(-4)}</div>
                      </div>
                    </div>

                    {/* Health Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Collateral Health</span>
                        <span className={getHealthColor(BigInt(Math.floor(healthRatio * 100)))}>
                          {healthRatio.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(healthRatio, 200)} className="h-2" />
                    </div>

                    {healthRatio < 150 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          ⚠️ Borrower&apos;s position is at risk. Monitor closely for liquidation opportunity.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      {healthRatio < 150 && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onLiquidate(position.id)}
                          disabled={isLiquidating}
                        >
                          Liquidate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Monitor
                      </Button>
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
          {borrowerPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active borrowing positions</p>
              <p className="text-sm">Your borrowing orders haven&apos;t been matched yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {borrowerPositions.map((position) => {
                const principal = Number(formatUnits(position.loanAmount, 6))
                const currentDebt = Number(formatUnits(position.currentDebt, 6))
                const collateralEth = Number(formatEther(position.collateralAmount))
                const collateralValue = collateralEth * ethPrice
                const healthFactor = Number(position.healthFactor) / 100

                return (
                  <div key={position.id.toString()} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg text-red-600">
                          -${currentDebt.toLocaleString()} USDC
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Borrowed: ${principal.toLocaleString()} • {Number(position.interestRate) / 100}% APR •{" "}
                          {Math.floor(Number(position.duration) / (24 * 60 * 60))}D
                        </div>
                      </div>
                      <Badge variant={position.isLiquidatable ? "destructive" : getHealthBadgeVariant(position.healthFactor)}>
                        {position.isLiquidatable ? "AT RISK" : `Health: ${healthFactor.toFixed(1)}`}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Your Collateral</div>
                        <div className="font-medium">{collateralEth.toFixed(4)} ETH</div>
                        <div className="text-xs text-muted-foreground">
                          ${collateralValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Maturity</div>
                        <div className="font-medium flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatTimeRemaining(position.remainingDays)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Interest Owed</div>
                        <div className="font-medium text-red-600">
                          ${(currentDebt - principal).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Lender</div>
                        <div className="font-mono text-xs">{position.lender.slice(0, 6)}...{position.lender.slice(-4)}</div>
                      </div>
                    </div>

                    {/* Health Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Position Health</span>
                        <span className={getHealthColor(position.healthFactor)}>
                          {healthFactor.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={Math.min(healthFactor * 100, 200)} className="h-2" />
                    </div>

                    {position.isLiquidatable && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          ⚠️ Your position is at risk of liquidation! Repay immediately.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={position.isLiquidatable ? "destructive" : "default"}
                        onClick={() => onRepay(position.id, position.currentDebt)}
                        disabled={isRepaying}
                      >
                        {isRepaying ? "Processing..." : "Repay Loan"}
                      </Button>
                      <Button size="sm" variant="outline">
                        Add Collateral
                      </Button>
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
    </div>
  )
}