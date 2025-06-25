'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDebtHook, type Loan } from './useDebtHook'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'
import { formatUnits } from 'viem'
import { supabase } from '@/lib/supabase'
import { useEthPrice } from '@/hooks/use-eth-price'

export interface EnrichedLoan extends Loan {
  currentDebt: bigint
  healthFactor: number
  isLiquidatable: boolean
  remainingDays: number
  accruedInterest: bigint
  order?: any // Original order data from Supabase
}

export function useUserPositions() {
  const { address } = usePrivyWallet()
  const { getLoan, calculateCurrentDebt, getHealthFactor } = useDebtHook()
  const { price: ethPrice } = useEthPrice()
  
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
      // Fetch loans from Supabase instead of orders
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .or(`lender.eq.${address},borrower.eq.${address}`)
        .in('status', ['active', 'pending'])

      if (loansError) throw loansError

      if (!loans || loans.length === 0) {
        setBorrowerPositions([])
        setLenderPositions([])
        return
      }

      // Separate borrower and lender loans
      const borrowerLoans = loans.filter(loan => loan.borrower === address)
      const lenderLoans = loans.filter(loan => loan.lender === address)

      // Use current ethPrice value without making it a dependency
      const currentEthPrice = ethPrice || 2000

      // Fetch loan details for borrower positions
      const borrowerPositionsList = await Promise.all(
        borrowerLoans.map(async (dbLoan) => {
          const loanId = `0x${dbLoan.loan_id.toString(16).padStart(64, '0')}` // Convert to bytes32

          const loan = await getLoan(loanId)
          if (!loan || loan.status === 1 || loan.status === 2) return null // Skip repaid or liquidated

          const [currentDebt, healthFactor] = await Promise.all([
            calculateCurrentDebt(loanId),
            getHealthFactor(loanId, currentEthPrice),
          ])

          const enrichedLoan: EnrichedLoan = {
            ...loan,
            currentDebt,
            healthFactor,
            isLiquidatable: healthFactor < 150, // 1.5 health factor
            remainingDays: Math.max(0, Math.floor(
              (Number(loan.startTime + loan.duration) - Date.now() / 1000) / (24 * 60 * 60)
            )),
            accruedInterest: currentDebt - loan.loanAmount,
            order: dbLoan,
          }

          return enrichedLoan
        })
      )

      // Fetch loan details for lender positions
      const lenderPositionsList = await Promise.all(
        lenderLoans.map(async (dbLoan) => {
          const loanId = `0x${dbLoan.loan_id.toString(16).padStart(64, '0')}` // Convert to bytes32

          const loan = await getLoan(loanId)
          if (!loan || loan.status === 1 || loan.status === 2) return null // Skip repaid or liquidated

          const currentDebt = await calculateCurrentDebt(loanId)

          const enrichedLoan: EnrichedLoan = {
            ...loan,
            currentDebt,
            healthFactor: 0, // Not relevant for lenders
            isLiquidatable: false,
            remainingDays: Math.max(0, Math.floor(
              (Number(loan.startTime + loan.duration) - Date.now() / 1000) / (24 * 60 * 60)
            )),
            accruedInterest: currentDebt - loan.loanAmount,
            order: dbLoan,
          }

          return enrichedLoan
        })
      )

      // Filter out null values and set state
      setBorrowerPositions(borrowerPositionsList.filter((loan): loan is EnrichedLoan => loan !== null))
      setLenderPositions(lenderPositionsList.filter((loan): loan is EnrichedLoan => loan !== null))

    } catch (err) {
      console.error('Error fetching positions:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [address, getLoan, calculateCurrentDebt, getHealthFactor]) // Removed ethPrice dependency

  useEffect(() => {
    fetchPositions()
  }, [address]) // Only refetch when address changes

  // Add a separate effect to update health factors when ethPrice changes
  useEffect(() => {
    if (!ethPrice || borrowerPositions.length === 0) return

    // Update health factors for existing positions when price changes
    const updateHealthFactors = async () => {
      const updatedPositions = await Promise.all(
        borrowerPositions.map(async (position) => {
          const loanId = position.id
          const healthFactor = await getHealthFactor(loanId, ethPrice)
          
          return {
            ...position,
            healthFactor,
            isLiquidatable: healthFactor < 150,
          }
        })
      )
      setBorrowerPositions(updatedPositions)
    }

    updateHealthFactors()
  }, [ethPrice, getHealthFactor]) // Only update when price changes, not refetch everything

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