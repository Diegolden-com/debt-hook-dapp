'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlusCircle, Fuel, DollarSign, Clock, Zap, TrendingUp } from 'lucide-react'
import { useCreateOrder } from '@/hooks/useCreateOrder'
import { useEnhancedDebtOrderBook } from '@/lib/hooks/contracts/useEnhancedDebtOrderBook'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { usePaymaster } from '@/hooks/usePaymaster'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'

type ExecutionMode = 'direct' | 'batch'

export function CreateOfferModalWithBatch() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [minRate, setMinRate] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [duration, setDuration] = useState('30')
  const [useUSDCForGas, setUseUSDCForGas] = useState(false)
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('direct')
  
  // Batch-specific parameters
  const [minPrincipal, setMinPrincipal] = useState('')
  const [maxPrincipal, setMaxPrincipal] = useState('')
  
  const { createOrder, isCreating } = useCreateOrder()
  const { submitOrderToAVS, isSubmitting, serviceManager } = useEnhancedDebtOrderBook()
  const { address } = usePrivyWallet()
  const { 
    preparePaymaster, 
    estimateGasCost, 
    hasEnoughUSDCForGas,
    usdcBalance,
    isPreparingPaymaster 
  } = usePaymaster()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const principalAmount = parseUnits(amount, 6) // USDC has 6 decimals
      const maturityTimestamp = BigInt(Math.floor(Date.now() / 1000) + Number(duration) * 24 * 60 * 60)
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60) // 24 hours
      
      // Prepare base order parameters
      const orderParams = {
        principalAmount,
        minRate: Number(minRate),
        maxRate: Number(maxRate),
        maturityTimestamp,
        expiry
      }

      if (executionMode === 'direct') {
        // Direct execution flow (existing behavior)
        let paymasterData = null
        if (useUSDCForGas) {
          const estimatedGasLimit = 150_000n
          const gasCostUSDC = await estimateGasCost(estimatedGasLimit)
          
          if (!hasEnoughUSDCForGas(gasCostUSDC)) {
            toast.error(
              `Insufficient USDC for gas. Need ${formatUnits(gasCostUSDC, 6)} USDC`
            )
            return
          }

          paymasterData = await preparePaymaster(estimatedGasLimit)
          if (!paymasterData) return
        }

        await createOrder(orderParams, paymasterData)
        toast.success('Loan offer created successfully!')
      } else {
        // Batch execution flow
        if (!serviceManager || serviceManager === '0x0000000000000000000000000000000000000000') {
          toast.error('Batch matching is not available. Please use direct execution.')
          return
        }

        // First create the signed order
        const signedOrder = await createOrder(orderParams, null, true) // true flag for batch mode
        
        // Then submit to AVS
        await submitOrderToAVS({
          order: signedOrder,
          minPrincipal: parseUnits(minPrincipal || amount, 6),
          maxPrincipal: parseUnits(maxPrincipal || amount, 6),
          minRate: BigInt(Math.round(Number(minRate) * 100)), // Convert to basis points
          maxRate: BigInt(Math.round(Number(maxRate) * 100))
        })
        
        toast.success('Order submitted to batch matching!')
      }
      
      // Reset form and close modal
      setAmount('')
      setMinRate('')
      setMaxRate('')
      setDuration('30')
      setMinPrincipal('')
      setMaxPrincipal('')
      setUseUSDCForGas(false)
      setExecutionMode('direct')
      setOpen(false)
      
    } catch (error) {
      console.error('Error creating offer:', error)
      toast.error('Failed to create loan offer')
    }
  }

  const isFormValid = amount && minRate && maxRate && Number(minRate) <= Number(maxRate)
  const isBatchMode = executionMode === 'batch'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Loan Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Loan Offer</DialogTitle>
            <DialogDescription>
              Set your lending terms. Choose between instant or batch matching.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Execution Mode Selection */}
            <div className="space-y-3">
              <Label>Execution Mode</Label>
              <RadioGroup value={executionMode} onValueChange={(value) => setExecutionMode(value as ExecutionMode)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Direct Execution</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Instant matching, higher gas costs
                    </p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="batch" id="batch" />
                  <Label htmlFor="batch" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">Batch Matching</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Better rates via CoW matching, ~5 min delay
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Loan Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minRate">Min APR (%)</Label>
                <Input
                  id="minRate"
                  type="number"
                  placeholder="5"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="maxRate">Max APR (%)</Label>
                <Input
                  id="maxRate"
                  type="number"
                  placeholder="10"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            {/* Batch-specific fields */}
            {isBatchMode && (
              <>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your order will be matched in the next batch round. You can specify partial fill preferences below.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minPrincipal">Min Principal (USDC)</Label>
                    <Input
                      id="minPrincipal"
                      type="number"
                      placeholder={amount ? (Number(amount) * 0.8).toFixed(2) : "800"}
                      value={minPrincipal}
                      onChange={(e) => setMinPrincipal(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="maxPrincipal">Max Principal (USDC)</Label>
                    <Input
                      id="maxPrincipal"
                      type="number"
                      placeholder={amount ? (Number(amount) * 1.2).toFixed(2) : "1200"}
                      value={maxPrincipal}
                      onChange={(e) => setMaxPrincipal(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="365"
              />
            </div>

            {/* USDC Gas Payment Option (only for direct mode) */}
            {!isBatchMode && (
              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                <Checkbox
                  id="useUSDCForGas"
                  checked={useUSDCForGas}
                  onCheckedChange={(checked) => setUseUSDCForGas(checked as boolean)}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="useUSDCForGas" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Fuel className="h-4 w-4" />
                    Pay gas fees with USDC
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use your USDC balance to pay for transaction fees
                  </p>
                  {usdcBalance && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: {formatUnits(usdcBalance, 6)} USDC
                    </p>
                  )}
                </div>
              </div>
            )}

            {useUSDCForGas && usdcBalance && usdcBalance < parseUnits('1', 6) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Insufficient USDC balance for gas payment
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={
                !isFormValid || 
                isCreating || 
                isSubmitting ||
                isPreparingPaymaster ||
                (useUSDCForGas && (!usdcBalance || usdcBalance < parseUnits('1', 6)))
              }
            >
              {isCreating || isSubmitting || isPreparingPaymaster 
                ? 'Creating...' 
                : isBatchMode 
                  ? 'Submit to Batch' 
                  : 'Create Offer'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}