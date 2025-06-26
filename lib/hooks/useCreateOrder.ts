'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import type { SignedLoanOrder } from '@/lib/hooks/contracts'

interface CreateOrderParams extends SignedLoanOrder {
  term: string
  rate: string
  amount: string
  ltv: string
  useGaslessTransaction?: boolean
}

export function useCreateOrder() {
  const [isCreating, setIsCreating] = useState(false)

  const createOrder = async (params: CreateOrderParams) => {
    setIsCreating(true)
    try {
      // Create entries in both tables for proper data flow
      
      // 1. Save to signed_orders table with full signed data
      const signedOrderData = {
        id: uuidv4(),
        lender: params.lender.toLowerCase(),
        collateral_amount: params.collateralAmount.toString(),
        loan_amount: params.loanAmount.toString(),
        interest_rate_bips: Number(params.interestRate),
        duration: Number(params.duration),
        expiry: Number(params.expiry),
        nonce: Number(params.nonce),
        signature: params.signature as any, // JSON type in database
        order_hash: '0x' + Buffer.from(
          params.lender + 
          params.collateralAmount.toString() + 
          params.loanAmount.toString() + 
          params.nonce.toString()
        ).toString('hex').slice(0, 64), // Simple hash for now
        collateral_token: '0x0000000000000000000000000000000000000000', // ETH
        loan_token: '0x0000000000000000000000000000000000000000', // Will be replaced with USDC address
        rate_per_second: '0', // Will be calculated by contract
        status: 'active'
      }

      const { data: signedOrder, error: signedOrderError } = await supabase
        .from('signed_orders')
        .insert([signedOrderData])
        .select()
        .single()

      if (signedOrderError) {
        console.error('Error saving signed order:', signedOrderError)
        throw signedOrderError
      }

      // 2. Save to orders table for market display
      const orderData = {
        id: signedOrder.id, // Use same ID for linking
        type: 'ask', // Lender is asking (offering to lend)
        lender: params.lender.toLowerCase(),
        amount: Number(params.amount),
        rate: Number(params.rate),
        term: Number(params.term),
        max_ltv: Number(params.ltv),
        status: 'active'
      }

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData])

      if (orderError) {
        console.error('Error saving order:', orderError)
        // Try to clean up the signed_order if orders insert fails
        await supabase
          .from('signed_orders')
          .delete()
          .eq('id', signedOrder.id)
        throw orderError
      }

      toast.success('Lending offer created successfully!')
      return { success: true, orderId: signedOrder.id }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create lending offer')
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createOrder,
    isCreating,
  }
}