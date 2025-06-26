'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Fuel, DollarSign, Info } from 'lucide-react'
import { formatUnits } from 'viem'
import { usePaymaster } from '@/hooks/usePaymaster'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GasPaymentToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  estimatedGasLimit?: bigint
}

export function GasPaymentToggle({ 
  enabled, 
  onToggle,
  estimatedGasLimit = 200_000n // Default gas estimate
}: GasPaymentToggleProps) {
  const { usdcBalance, estimateGasCost } = usePaymaster()
  const [estimatedCost, setEstimatedCost] = useState<bigint | null>(null)

  useEffect(() => {
    if (enabled && estimatedGasLimit) {
      estimateGasCost(estimatedGasLimit)
        .then(setEstimatedCost)
        .catch(console.error)
    }
  }, [enabled, estimatedGasLimit, estimateGasCost])

  const hasEnoughBalance = usdcBalance && estimatedCost 
    ? usdcBalance >= estimatedCost 
    : false

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <Switch
          id="gas-payment"
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={!usdcBalance || (usdcBalance && usdcBalance === 0n)}
        />
        <div className="space-y-1">
          <Label 
            htmlFor="gas-payment" 
            className="flex items-center gap-2 cursor-pointer"
          >
            <Fuel className="h-4 w-4" />
            Pay gas with USDC
          </Label>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {usdcBalance && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Balance: {formatUnits(usdcBalance, 6)} USDC
              </span>
            )}
            {enabled && estimatedCost && (
              <span className="flex items-center gap-1">
                Est. cost: ~{formatUnits(estimatedCost, 6)} USDC
              </span>
            )}
          </div>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <p>
              Enable this to pay transaction fees using USDC instead of ETH. 
              Circle's paymaster will handle the gas payment on your behalf.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {enabled && !hasEnoughBalance && (
        <div className="absolute inset-x-4 -bottom-12 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          Insufficient USDC balance for gas payment
        </div>
      )}
    </div>
  )
}