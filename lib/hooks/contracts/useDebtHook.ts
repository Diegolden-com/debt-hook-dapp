'use client'

import { useCallback, useState, useEffect } from 'react'
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
  id: bigint
  borrower: Address
  lender: Address
  collateralAmount: bigint
  loanAmount: bigint
  interestRate: bigint
  startTime: bigint
  duration: bigint
  repaidAmount: bigint
  liquidated: boolean
}

export function useDebtHook() {
  const { address, walletClient } = usePrivyWallet()
  const [nextLoanId, setNextLoanId] = useState<bigint | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  })

  // Get next loan ID
  useEffect(() => {
    async function fetchNextLoanId() {
      if (!publicClient) return
      
      try {
        const id = await publicClient.readContract({
          address: contracts.debtHook.address,
          abi: contracts.debtHook.abi,
          functionName: 'nextLoanId',
        })
        setNextLoanId(id as bigint)
      } catch (error) {
        console.error('Error fetching next loan ID:', error)
      }
    }
    
    fetchNextLoanId()
  }, [publicClient])

  // Get loan by ID
  const getLoan = useCallback(async (loanId: bigint): Promise<Loan | null> => {
    if (!publicClient) return null
    
    try {
      const loan = await publicClient.readContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'loans',
        args: [loanId],
      })
      
      return loan as Loan
    } catch (error) {
      console.error('Error fetching loan:', error)
      return null
    }
  }, [publicClient])

  // Get user's loans as borrower
  const getBorrowerLoans = useCallback(async (borrower: Address): Promise<bigint[]> => {
    if (!publicClient) return []
    
    try {
      const loanIds = await publicClient.readContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'getBorrowerLoans',
        args: [borrower],
      })
      
      return loanIds as bigint[]
    } catch (error) {
      console.error('Error fetching borrower loans:', error)
      return []
    }
  }, [publicClient])

  // Get user's loans as lender
  const getLenderLoans = useCallback(async (lender: Address): Promise<bigint[]> => {
    if (!publicClient) return []
    
    try {
      const loanIds = await publicClient.readContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'getLenderLoans',
        args: [lender],
      })
      
      return loanIds as bigint[]
    } catch (error) {
      console.error('Error fetching lender loans:', error)
      return []
    }
  }, [publicClient])

  // Calculate current debt amount
  const calculateCurrentDebt = useCallback(async (loanId: bigint): Promise<bigint> => {
    if (!publicClient) return BigInt(0)
    
    try {
      const debt = await publicClient.readContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'calculateCurrentDebt',
        args: [loanId],
      })
      
      return debt as bigint
    } catch (error) {
      console.error('Error calculating debt:', error)
      return BigInt(0)
    }
  }, [publicClient])

  // Get health factor
  const getHealthFactor = useCallback(async (loanId: bigint): Promise<bigint> => {
    if (!publicClient) return BigInt(0)
    
    try {
      const healthFactor = await publicClient.readContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'getHealthFactor',
        args: [loanId],
      })
      
      return healthFactor as bigint
    } catch (error) {
      console.error('Error fetching health factor:', error)
      return BigInt(0)
    }
  }, [publicClient])

  // Repay loan
  const [repayHash, setRepayHash] = useState<Hash | null>(null)
  const [isRepaying, setIsRepaying] = useState(false)
  const [repayError, setRepayError] = useState<Error | null>(null)

  const repay = useCallback(async (loanId: bigint, amount: bigint) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsRepaying(true)
    setRepayError(null)

    try {
      // First approve USDC if needed
      const allowance = await publicClient.readContract({
        address: contracts.usdc.address,
        abi: contracts.usdc.abi,
        functionName: 'allowance',
        args: [address, contracts.debtHook.address],
      }) as bigint

      if (allowance < amount) {
        toast.info('Approving USDC...')
        
        const { request } = await publicClient.simulateContract({
          address: contracts.usdc.address,
          abi: contracts.usdc.abi,
          functionName: 'approve',
          args: [contracts.debtHook.address, amount],
          account: address,
        })

        const hash = await walletClient.writeContract(request)
        
        await publicClient.waitForTransactionReceipt({ hash })
        toast.success('USDC approved!')
      }

      // Now repay the loan
      const { request } = await publicClient.simulateContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'repayLoan',
        args: [loanId, amount],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      setRepayHash(hash)
      
      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('Loan repaid successfully!')
    } catch (error: any) {
      console.error('Error repaying loan:', error)
      setRepayError(error)
      toast.error(error.message || 'Failed to repay loan')
    } finally {
      setIsRepaying(false)
    }
  }, [walletClient, address, publicClient])

  // Liquidate loan
  const [liquidateHash, setLiquidateHash] = useState<Hash | null>(null)
  const [isLiquidating, setIsLiquidating] = useState(false)
  const [liquidateError, setLiquidateError] = useState<Error | null>(null)

  const liquidate = useCallback(async (loanId: bigint) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLiquidating(true)
    setLiquidateError(null)

    try {
      const { request } = await publicClient.simulateContract({
        address: contracts.debtHook.address,
        abi: contracts.debtHook.abi,
        functionName: 'liquidate',
        args: [loanId],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      setLiquidateHash(hash)
      
      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('Loan liquidated successfully!')
    } catch (error: any) {
      console.error('Error liquidating loan:', error)
      setLiquidateError(error)
      toast.error(error.message || 'Failed to liquidate loan')
    } finally {
      setIsLiquidating(false)
    }
  }, [walletClient, address, publicClient])

  return {
    // Read functions
    nextLoanId,
    getLoan,
    getBorrowerLoans,
    getLenderLoans,
    calculateCurrentDebt,
    getHealthFactor,
    
    // Write functions
    repay,
    liquidate,
    
    // Transaction states
    isRepaying,
    repayHash,
    repayError,
    isLiquidating,
    liquidateHash,
    liquidateError,
  }
}