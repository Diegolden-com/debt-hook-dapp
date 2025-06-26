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
import { PlusCircle, Fuel, DollarSign } from 'lucide-react'
import { useCreateOrder } from '@/hooks/useCreateOrder'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { usePaymaster } from '@/hooks/usePaymaster'

export function CreateOfferModalWithPaymaster() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [minRate, setMinRate] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [duration, setDuration] = useState('30')
  const [useUSDCForGas, setUseUSDCForGas] = useState(false)
  
  const { createOrder, isCreating } = useCreateOrder()
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
      
      // Prepare order parameters
      const orderParams = {
        principalAmount,
        minRate: Number(minRate),
        maxRate: Number(maxRate),
        maturityTimestamp,
        expiry
      }

      // Handle USDC gas payment if enabled
      let paymasterData = null
      if (useUSDCForGas) {
        // Estimate gas for creating an order (approximately 150k gas)
        const estimatedGasLimit = 150_000n
        const gasCostUSDC = await estimateGasCost(estimatedGasLimit)
        
        // Check if user has enough USDC
        if (!hasEnoughUSDCForGas(gasCostUSDC)) {
          toast.error(
            `Insufficient USDC for gas. Need ${formatUnits(gasCostUSDC, 6)} USDC`
          )
          return
        }

        // Prepare paymaster data
        paymasterData = await preparePaymaster(estimatedGasLimit)
        if (!paymasterData) return
      }

      // Create the order
      await createOrder(orderParams, paymasterData)
      
      // Reset form and close modal
      setAmount('')
      setMinRate('')
      setMaxRate('')
      setDuration('30')
      setUseUSDCForGas(false)
      setOpen(false)
      
      toast.success('Loan offer created successfully!')
    } catch (error) {
      console.error('Error creating offer:', error)
      toast.error('Failed to create loan offer')
    }
  }

  const isFormValid = amount && minRate && maxRate && Number(minRate) <= Number(maxRate)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Loan Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Loan Offer</DialogTitle>
            <DialogDescription>
              Set your lending terms. Borrowers can accept your offer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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

            {/* USDC Gas Payment Option */}
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
                isPreparingPaymaster ||
                (useUSDCForGas && (!usdcBalance || usdcBalance < parseUnits('1', 6)))
              }
            >
              {isCreating || isPreparingPaymaster ? 'Creating...' : 'Create Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}