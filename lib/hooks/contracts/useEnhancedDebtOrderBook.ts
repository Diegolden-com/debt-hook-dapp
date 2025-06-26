'use client'

import { useCallback, useState, useEffect } from 'react'
import { 
  createPublicClient,
  http,
  type Address, 
  parseEther, 
  formatEther,
  type Hash,
  type WalletClient
} from 'viem'
import { contracts, EIP712_DOMAIN, LOAN_ORDER_TYPES, chain, RPC_URL } from '@/lib/contracts/config'
import { toast } from 'sonner'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'
import { supabase } from '@/lib/supabase'

export interface LoanOrder {
  lender: Address
  collateralAmount: bigint
  loanAmount: bigint
  interestRate: bigint
  duration: bigint
  expiry: bigint
  nonce: bigint
}

export interface SignedLoanOrder extends LoanOrder {
  signature: `0x${string}`
}

export interface AVSOrderParams {
  minPrincipal: bigint
  maxPrincipal: bigint
  minRate: bigint
  maxRate: bigint
}

export interface BorrowerOrderParams {
  principalAmount: bigint
  maxInterestRateBips: bigint
  maturityTimestamp: bigint
  collateralAmount: bigint
  minPrincipal: bigint
  maxPrincipal: bigint
  expiry: bigint
}

export function useEnhancedDebtOrderBook() {
  const { address, walletClient } = usePrivyWallet()
  const [nonce, setNonce] = useState<bigint>(BigInt(0))
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmittingToAVS, setIsSubmittingToAVS] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  })

  // Generate a nonce based on timestamp and random value
  useEffect(() => {
    const timestamp = BigInt(Math.floor(Date.now() / 1000))
    const random = BigInt(Math.floor(Math.random() * 1000000))
    setNonce(timestamp * BigInt(1000000) + random)
  }, [])

  // Check if order has been executed
  const isOrderExecuted = useCallback(async (nonce: bigint): Promise<boolean> => {
    if (!publicClient) return false
    
    try {
      const used = await publicClient.readContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'usedNonces',
        args: [nonce],
      })
      
      return used as boolean
    } catch (error) {
      console.error('Error checking order status:', error)
      return false
    }
  }, [publicClient])

  // Sign a loan order
  const signLoanOrder = useCallback(async (order: Omit<LoanOrder, 'nonce'>): Promise<SignedLoanOrder | null> => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      const orderWithNonce: LoanOrder = {
        ...order,
        nonce: nonce,
      }

      const signature = await walletClient.signTypedData({
        account: address,
        domain: {
          ...EIP712_DOMAIN,
          verifyingContract: contracts.debtOrderBook.address,
        },
        types: LOAN_ORDER_TYPES,
        primaryType: 'LoanOrder',
        message: {
          lender: orderWithNonce.lender,
          collateralAmount: orderWithNonce.collateralAmount,
          loanAmount: orderWithNonce.loanAmount,
          interestRate: orderWithNonce.interestRate,
          duration: orderWithNonce.duration,
          expiry: orderWithNonce.expiry,
          nonce: orderWithNonce.nonce,
        },
      })

      const signedOrder: SignedLoanOrder = {
        ...orderWithNonce,
        signature: signature as `0x${string}`,
      }

      toast.success('Order signed successfully')
      
      // Increment nonce for next order
      setNonce(nonce + BigInt(1))
      
      return signedOrder
    } catch (error: any) {
      console.error('Error signing order:', error)
      toast.error('Failed to sign order', {
        description: error?.message || 'Unknown error'
      })
      return null
    }
  }, [walletClient, address, nonce])

  // Submit signed order to AVS for batch matching
  const submitOrderToAVS = useCallback(async (
    order: SignedLoanOrder,
    avsParams: AVSOrderParams
  ): Promise<Hash | null> => {
    if (!walletClient || !address || !publicClient) {
      toast.error('Please connect your wallet')
      return null
    }

    setIsSubmittingToAVS(true)
    try {
      // Format order for contract
      const limitOrder = {
        lender: order.lender,
        token: contracts.usdc.address,
        principalAmount: order.loanAmount,
        collateralRequired: order.collateralAmount,
        interestRateBips: Number(order.interestRate),
        maturityTimestamp: order.duration,
        expiry: order.expiry,
        nonce: order.nonce
      }

      // TODO: Update ABI when AVS functions are added to contract
      toast.info('AVS submission will be available once contracts are updated')
      return null
      
      /* Future implementation:
      const { request } = await publicClient.simulateContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'submitOrderToAVS',
        args: [
          limitOrder,
          order.signature,
          avsParams.minPrincipal,
          avsParams.maxPrincipal,
          avsParams.minRate,
          avsParams.maxRate
        ],
        account: address,
      })
      */

      // Commented out until ABI is updated
      // const hash = await walletClient.writeContract(request)
      // ... rest of the implementation
    } catch (error: any) {
      console.error('Error submitting to AVS:', error)
      toast.error('Failed to submit order to batch', {
        description: error?.message || 'Unknown error'
      })
      return null
    } finally {
      setIsSubmittingToAVS(false)
    }
  }, [walletClient, address, publicClient])

  // Submit borrower order to AVS (no signature required)
  const submitBorrowerOrderToAVS = useCallback(async (
    params: BorrowerOrderParams
  ): Promise<Hash | null> => {
    if (!walletClient || !address || !publicClient) {
      toast.error('Please connect your wallet')
      return null
    }

    setIsSubmittingToAVS(true)
    try {
      // TODO: Update ABI when AVS functions are added to contract
      toast.info('Borrower AVS submission will be available once contracts are updated')
      return null
      
      /* Future implementation:
      const { request } = await publicClient.simulateContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'submitBorrowerOrderToAVS',
        args: [
          params.principalAmount,
          params.maxInterestRateBips,
          params.maturityTimestamp,
          params.collateralAmount,
          params.minPrincipal,
          params.maxPrincipal,
          params.expiry
        ],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      */
      
      // Commented out until ABI is updated
      // ... rest of the implementation
    } catch (error: any) {
      console.error('Error submitting borrower order to AVS:', error)
      toast.error('Failed to submit borrower order to batch', {
        description: error?.message || 'Unknown error'
      })
      return null
    } finally {
      setIsSubmittingToAVS(false)
    }
  }, [walletClient, address, publicClient])

  // Create loan with signed order (direct execution)
  const createLoanWithOrder = useCallback(async (
    order: SignedLoanOrder,
    borrower: Address
  ): Promise<Hash | null> => {
    if (!walletClient || !address || !publicClient) {
      toast.error('Please connect your wallet')
      return null
    }

    setIsCreating(true)
    try {
      // Format order for contract
      const limitOrder = {
        lender: order.lender,
        token: contracts.usdc.address,
        principalAmount: order.loanAmount,
        collateralRequired: order.collateralAmount,
        interestRateBips: Number(order.interestRate),
        maturityTimestamp: order.duration,
        expiry: order.expiry,
        nonce: order.nonce
      }

      const { request } = await publicClient.simulateContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'fillLimitOrder',
        args: [limitOrder, order.signature],
        account: address,
        value: order.collateralAmount, // ETH collateral
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
      setIsCreating(false)
    }
  }, [walletClient, address, publicClient])

  // Get the next available nonce
  const getNextNonce = useCallback(async (): Promise<bigint> => {
    const timestamp = BigInt(Math.floor(Date.now() / 1000))
    const random = BigInt(Math.floor(Math.random() * 1000000))
    return timestamp * BigInt(1000000) + random
  }, [])

  // Get service manager address
  const getServiceManager = useCallback(async (): Promise<Address | null> => {
    if (!publicClient) return null
    
    try {
      // TODO: Update when serviceManager is added to ABI
      // For now, return null indicating AVS is not configured
      return null
      
      /* Future implementation:
      const serviceManager = await publicClient.readContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'serviceManager',
      })
      
      return serviceManager as Address
      */
    } catch (error) {
      console.error('Error getting service manager:', error)
      return null
    }
  }, [publicClient])

  return {
    // Original functions
    signLoanOrder,
    createLoanWithOrder,
    isOrderExecuted,
    getNextNonce,
    currentNonce: nonce,
    isCreating,
    isCancelling,
    
    // AVS functions
    submitOrderToAVS,
    submitBorrowerOrderToAVS,
    isSubmittingToAVS,
    getServiceManager,
  }
}