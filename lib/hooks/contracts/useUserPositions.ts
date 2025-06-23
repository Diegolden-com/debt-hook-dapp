'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDebtHook, type Loan } from './useDebtHook'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'
import { formatUnits } from 'viem'
import { supabase } from '@/lib/supabase'

export interface EnrichedLoan extends Loan {
  currentDebt: bigint
  healthFactor: bigint
  isLiquidatable: boolean
  remainingDays: number
  accruedInterest: bigint
  order?: any // Original order data from Supabase
}

export function useUserPositions() {
  const { address } = usePrivyWallet()
  const { getLoan, getBorrowerLoans, getLenderLoans, calculateCurrentDebt, getHealthFactor } = useDebtHook()
  
  const [borrowerPositions, setBorrowerPositions] = useState<EnrichedLoan[]>([])
  const [lenderPositions, setLenderPositions] = useState<EnrichedLoan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPositions = useCallback(async () => {
    if (!address) {
      setBorrowerPositions([])
      setLenderPositions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch loan IDs
      const [borrowerLoanIds, lenderLoanIds] = await Promise.all([
        getBorrowerLoans(address),
        getLenderLoans(address),
      ])

      // Fetch loan details for borrower positions
      const borrowerLoans = await Promise.all(
        borrowerLoanIds.map(async (loanId) => {
          const loan = await getLoan(loanId)
          if (!loan || loan.liquidated || loan.repaidAmount === loan.loanAmount) return null

          const [currentDebt, healthFactor] = await Promise.all([
            calculateCurrentDebt(loanId),
            getHealthFactor(loanId),
          ])

          const enrichedLoan: EnrichedLoan = {
            ...loan,
            currentDebt,
            healthFactor,
            isLiquidatable: healthFactor < BigInt(150), // 1.5 health factor
            remainingDays: Math.max(0, Math.floor(
              (Number(loan.startTime + loan.duration) - Date.now() / 1000) / (24 * 60 * 60)
            )),
            accruedInterest: currentDebt - loan.loanAmount,
          }

          return enrichedLoan
        })
      )

      // Fetch loan details for lender positions
      const lenderLoans = await Promise.all(
        lenderLoanIds.map(async (loanId) => {
          const loan = await getLoan(loanId)
          if (!loan || loan.liquidated || loan.repaidAmount === loan.loanAmount) return null

          const currentDebt = await calculateCurrentDebt(loanId)

          const enrichedLoan: EnrichedLoan = {
            ...loan,
            currentDebt,
            healthFactor: BigInt(0), // Not relevant for lenders
            isLiquidatable: false,
            remainingDays: Math.max(0, Math.floor(
              (Number(loan.startTime + loan.duration) - Date.now() / 1000) / (24 * 60 * 60)
            )),
            accruedInterest: currentDebt - loan.loanAmount,
          }

          return enrichedLoan
        })
      )

      // Filter out null values and set state
      setBorrowerPositions(borrowerLoans.filter((loan): loan is EnrichedLoan => loan !== null))
      setLenderPositions(lenderLoans.filter((loan): loan is EnrichedLoan => loan !== null))

    } catch (err) {
      console.error('Error fetching positions:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [address, getLoan, getBorrowerLoans, getLenderLoans, calculateCurrentDebt, getHealthFactor])

  // Fetch orders from Supabase for additional metadata
  const fetchOrderMetadata = useCallback(async () => {
    if (!address) return

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .or(`lender.eq.${address},borrower.eq.${address}`)
        .eq('status', 'filled')

      // Match orders with loans
      // This is a simplified approach - in production you'd need a better way to link orders to loans
      // For now, we'll skip this step
    } catch (err) {
      console.error('Error fetching order metadata:', err)
    }
  }, [address])

  useEffect(() => {
    fetchPositions()
    fetchOrderMetadata()
  }, [fetchPositions, fetchOrderMetadata])

  // Calculate portfolio stats
  const calculateStats = useCallback(() => {
    const totalBorrowed = borrowerPositions.reduce(
      (sum, pos) => sum + Number(formatUnits(pos.loanAmount, 6)),
      0
    )
    
    const totalLent = lenderPositions.reduce(
      (sum, pos) => sum + Number(formatUnits(pos.loanAmount, 6)),
      0
    )
    
    const totalDebt = borrowerPositions.reduce(
      (sum, pos) => sum + Number(formatUnits(pos.currentDebt, 6)),
      0
    )
    
    const totalInterestOwed = borrowerPositions.reduce(
      (sum, pos) => sum + Number(formatUnits(pos.accruedInterest, 6)),
      0
    )
    
    const totalInterestEarning = lenderPositions.reduce(
      (sum, pos) => sum + Number(formatUnits(pos.accruedInterest, 6)),
      0
    )
    
    const atRiskPositions = borrowerPositions.filter(pos => pos.isLiquidatable).length

    return {
      totalBorrowed,
      totalLent,
      totalDebt,
      totalInterestOwed,
      totalInterestEarning,
      atRiskPositions,
      netPosition: totalLent - totalBorrowed,
    }
  }, [borrowerPositions, lenderPositions])

  return {
    borrowerPositions,
    lenderPositions,
    isLoading,
    error,
    refetch: fetchPositions,
    stats: calculateStats(),
  }
}