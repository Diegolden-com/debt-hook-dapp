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

export function useDebtOrderBook() {
  const { address, walletClient } = usePrivyWallet()
  const [nonce, setNonce] = useState<bigint | null>(null)
  
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  })

  // Get user's nonce
  useEffect(() => {
    async function fetchNonce() {
      if (!publicClient || !address) return
      
      try {
        const userNonce = await publicClient.readContract({
          address: contracts.debtOrderBook.address,
          abi: contracts.debtOrderBook.abi,
          functionName: 'nonces',
          args: [address],
        })
        setNonce(userNonce as bigint)
      } catch (error) {
        console.error('Error fetching nonce:', error)
      }
    }
    
    fetchNonce()
  }, [publicClient, address])

  // Check if order has been executed
  const isOrderExecuted = useCallback(async (orderHash: `0x${string}`): Promise<boolean> => {
    if (!publicClient) return false
    
    try {
      const executed = await publicClient.readContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'executedOrders',
        args: [orderHash],
      })
      
      return executed as boolean
    } catch (error) {
      console.error('Error checking order status:', error)
      return false
    }
  }, [publicClient])

  // Sign a loan order
  const signLoanOrder = useCallback(async (order: Omit<LoanOrder, 'nonce'>): Promise<SignedLoanOrder | null> => {
    if (!walletClient || !address || nonce === null) {
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
        message: orderWithNonce,
      })

      return {
        ...orderWithNonce,
        signature,
      }
    } catch (error: any) {
      console.error('Error signing order:', error)
      toast.error(error.message || 'Failed to sign order')
      return null
    }
  }, [walletClient, address, nonce])

  // Execute order
  const [executeHash, setExecuteHash] = useState<Hash | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<Error | null>(null)

  const execute = useCallback(async (order: SignedLoanOrder) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsExecuting(true)
    setExecuteError(null)

    try {
      // First approve WETH for collateral if needed
      const allowance = await publicClient.readContract({
        address: contracts.weth.address,
        abi: contracts.weth.abi,
        functionName: 'allowance',
        args: [address, contracts.debtOrderBook.address],
      }) as bigint

      if (allowance < order.collateralAmount) {
        toast.info('Approving WETH for collateral...')
        
        const { request } = await publicClient.simulateContract({
          address: contracts.weth.address,
          abi: contracts.weth.abi,
          functionName: 'approve',
          args: [contracts.debtOrderBook.address, order.collateralAmount],
          account: address,
        })

        const hash = await walletClient.writeContract(request)
        
        await publicClient.waitForTransactionReceipt({ hash })
        toast.success('WETH approved!')
      }

      // Execute the order
      const { request } = await publicClient.simulateContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'createLoanWithOrder',
        args: [order, order.signature],
        value: order.collateralAmount, // Send ETH as collateral
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      setExecuteHash(hash)
      
      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('Order executed successfully!')
    } catch (error: any) {
      console.error('Error executing order:', error)
      setExecuteError(error)
      toast.error(error.message || 'Failed to execute order')
    } finally {
      setIsExecuting(false)
    }
  }, [walletClient, address, publicClient])

  // Cancel order
  const [cancelHash, setCancelHash] = useState<Hash | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<Error | null>(null)

  const cancel = useCallback(async (orderHash: `0x${string}`) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsCancelling(true)
    setCancelError(null)

    try {
      const { request } = await publicClient.simulateContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'cancelOrder',
        args: [orderHash],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      setCancelHash(hash)
      
      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('Order cancelled successfully!')
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      setCancelError(error)
      toast.error(error.message || 'Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }, [walletClient, address, publicClient])

  // Increment nonce (for cancelling all orders)
  const [incrementHash, setIncrementHash] = useState<Hash | null>(null)
  const [isIncrementing, setIsIncrementing] = useState(false)
  const [incrementError, setIncrementError] = useState<Error | null>(null)

  const cancelAllOrders = useCallback(async () => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsIncrementing(true)
    setIncrementError(null)

    try {
      const { request } = await publicClient.simulateContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'incrementNonce',
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      setIncrementHash(hash)
      
      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('All orders cancelled!')
      // Refresh nonce
      const newNonce = await publicClient.readContract({
        address: contracts.debtOrderBook.address,
        abi: contracts.debtOrderBook.abi,
        functionName: 'nonces',
        args: [address],
      })
      setNonce(newNonce as bigint)
    } catch (error: any) {
      console.error('Error incrementing nonce:', error)
      setIncrementError(error)
      toast.error(error.message || 'Failed to cancel all orders')
    } finally {
      setIsIncrementing(false)
    }
  }, [walletClient, address, publicClient])

  return {
    // Read functions
    nonce,
    isOrderExecuted,
    
    // Sign function
    signLoanOrder,
    
    // Write functions
    execute,
    cancel,
    cancelAllOrders,
    
    // Transaction states
    isExecuting,
    executeHash,
    executeError,
    isCancelling,
    cancelHash,
    cancelError,
    isIncrementing,
    incrementHash,
    incrementError,
  }
}