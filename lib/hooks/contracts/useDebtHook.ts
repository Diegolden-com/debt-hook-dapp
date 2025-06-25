'use client'

import { useCallback, useState } from 'react'
import { 
  createPublicClient,
  http,
  parseEther, 
  formatEther, 
  formatUnits, 
  type Address,
  type Hash
} from 'viem'
import { contracts, chain, RPC_URL } from '@/lib/contracts/config'
import { toast } from 'sonner'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'

export interface Loan {
  id: string
  borrower: Address
  lender: Address
  collateralAmount: bigint
  loanAmount: bigint
  interestRate: bigint
  startTime: bigint
  duration: bigint
  status: number
}

export function useDebtHook() {
  const { address, walletClient } = usePrivyWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [isRepaying, setIsRepaying] = useState(false)
  const [isLiquidating, setIsLiquidating] = useState(false)
  
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  })

  // Get loan by ID
  const getLoan = useCallback(async (loanId: string): Promise<Loan | null> => {
    if (!publicClient) return null
    
    try {
      const result = await publicClient.readContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'loans',
        args: [loanId as `0x${string}`],
      })
      
      // Parse the result based on the Loan struct in the contract
      const [id, lender, borrower, principalAmount, collateralAmount, creationTimestamp, maturityTimestamp, interestRateBips, status] = result as readonly [string, `0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint, number, number]
      
      const loan: Loan = {
        id,
        borrower,
        lender,
        collateralAmount,
        loanAmount: principalAmount,
        interestRate: BigInt(interestRateBips),
        startTime: creationTimestamp,
        duration: maturityTimestamp - creationTimestamp,
        status
      }
      
      return loan
    } catch (error) {
      console.error('Error fetching loan:', error)
      return null
    }
  }, [publicClient])

  // Calculate current debt with interest
  const calculateCurrentDebt = useCallback(async (loanId: string): Promise<bigint> => {
    if (!publicClient) return BigInt(0)
    
    try {
      const loan = await getLoan(loanId)
      if (!loan) return BigInt(0)
      
      // Calculate interest based on time elapsed
      const currentTime = BigInt(Math.floor(Date.now() / 1000))
      const timeElapsed = currentTime - loan.startTime
      const annualRate = loan.interestRate
      const principal = loan.loanAmount
      
      // Simple interest calculation: P * r * t / (365 * 24 * 60 * 60 * 10000)
      // where r is in bips (basis points)
      const interest = (principal * annualRate * timeElapsed) / (BigInt(365 * 24 * 60 * 60 * 10000))
      
      return principal + interest
    } catch (error) {
      console.error('Error calculating debt:', error)
      return BigInt(0)
    }
  }, [publicClient, getLoan])

  // Get health factor
  const getHealthFactor = useCallback(async (loanId: string, ethPrice: number): Promise<number> => {
    if (!publicClient) return 0
    
    try {
      const loan = await getLoan(loanId)
      if (!loan) return 0
      
      const currentDebt = await calculateCurrentDebt(loanId)
      const collateralValueUSD = Number(formatEther(loan.collateralAmount)) * ethPrice
      const debtValueUSD = Number(formatUnits(currentDebt, 6)) // USDC has 6 decimals
      
      if (debtValueUSD === 0) return 9999 // Max health
      
      return (collateralValueUSD / debtValueUSD) * 100
    } catch (error) {
      console.error('Error calculating health factor:', error)
      return 0
    }
  }, [publicClient, getLoan, calculateCurrentDebt])

  // Create a new loan
  const createLoan = useCallback(async (params: {
    lender: Address
    borrower: Address
    principalAmount: bigint
    collateralAmount: bigint
    maturityTimestamp: bigint
    interestRateBips: number
  }): Promise<Hash | null> => {
    if (!walletClient || !address || !publicClient) {
      toast.error('Please connect your wallet')
      return null
    }

    setIsLoading(true)
    try {
      const { request } = await publicClient.simulateContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'createLoan',
        args: [{
          lender: params.lender,
          borrower: params.borrower,
          principalAmount: params.principalAmount,
          collateralAmount: params.collateralAmount,
          maturityTimestamp: params.maturityTimestamp,
          interestRateBips: params.interestRateBips
        }],
        account: address,
        value: params.collateralAmount // ETH collateral
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Loan creation initiated', {
        description: 'Transaction submitted',
      })

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      
      toast.success('Loan created successfully!')
      return hash
    } catch (error: any) {
      console.error('Error creating loan:', error)
      toast.error('Failed to create loan', {
        description: error?.message || 'Unknown error'
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, address, publicClient])

  // Repay loan
  const repay = useCallback(async (loanId: string, amount: bigint): Promise<Hash | null> => {
    if (!walletClient || !address || !publicClient) {
      toast.error('Please connect your wallet')
      return null
    }

    setIsRepaying(true)
    try {
      const { request } = await publicClient.simulateContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'repayLoan',
        args: [loanId as `0x${string}`],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Repayment initiated', {
        description: 'Transaction submitted',
      })

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      
      toast.success('Loan repaid successfully!')
      return hash
    } catch (error: any) {
      console.error('Error repaying loan:', error)
      toast.error('Failed to repay loan', {
        description: error?.message || 'Unknown error'
      })
      return null
    } finally {
      setIsRepaying(false)
    }
  }, [walletClient, address, publicClient])

  // Liquidate loan
  const liquidate = useCallback(async (loanId: string): Promise<Hash | null> => {
    if (!walletClient || !address || !publicClient) {
      toast.error('Please connect your wallet')
      return null
    }

    setIsLiquidating(true)
    try {
      const { request } = await publicClient.simulateContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'liquidate',
        args: [loanId as `0x${string}`],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Liquidation initiated', {
        description: 'Transaction submitted',
      })

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      
      toast.success('Loan liquidated successfully!')
      return hash
    } catch (error: any) {
      console.error('Error liquidating loan:', error)
      toast.error('Failed to liquidate loan', {
        description: error?.message || 'Unknown error'
      })
      return null
    } finally {
      setIsLiquidating(false)
    }
  }, [walletClient, address, publicClient])

  return {
    getLoan,
    createLoan,
    repay,
    liquidate,
    calculateCurrentDebt,
    getHealthFactor,
    isLoading,
    isRepaying,
    isLiquidating,
  }
}