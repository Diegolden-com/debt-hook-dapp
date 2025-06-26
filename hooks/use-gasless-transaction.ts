'use client'

import { useState, useCallback } from 'react'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'
import { 
  preparePaymasterData, 
  estimateGasCostInUSDC,
  PAYMASTER_CONFIG 
} from '@/lib/paymaster/usdc-paymaster'
import { createPublicClient, http, type Hash } from 'viem'
import { chain, RPC_URL } from '@/lib/contracts/config'
import { toast } from 'sonner'

export interface GaslessTransactionOptions {
  // Whether to use USDC for gas payment
  useUSDCForGas?: boolean
  // ETH price in USDC (6 decimals) - required if useUSDCForGas is true
  ethPriceInUSDC?: bigint
  // Custom gas limit estimation
  gasLimit?: bigint
}

export function useGaslessTransaction() {
  const { walletClient, address } = usePrivyWallet()
  const [isPreparingPaymaster, setIsPreparingPaymaster] = useState(false)
  
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  })

  /**
   * Checks if user has sufficient USDC balance for gas payment
   */
  const checkUSDCBalance = useCallback(async (
    requiredAmount: bigint
  ): Promise<boolean> => {
    if (!address) return false
    
    try {
      const balance = await publicClient.readContract({
        address: PAYMASTER_CONFIG.usdcAddress,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'balanceOf',
        args: [address]
      })
      
      return (balance as bigint) >= requiredAmount
    } catch (error) {
      console.error('Error checking USDC balance:', error)
      return false
    }
  }, [address, publicClient])

  /**
   * Prepares a transaction with optional USDC gas payment
   */
  const prepareTransaction = useCallback(async (
    transaction: any,
    options: GaslessTransactionOptions = {}
  ) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected')
    }

    const { useUSDCForGas, ethPriceInUSDC, gasLimit } = options

    // If not using USDC for gas, return transaction as-is
    if (!useUSDCForGas) {
      return { transaction, paymasterData: null }
    }

    // Validate required parameters
    if (!ethPriceInUSDC) {
      throw new Error('ETH price required for USDC gas payment')
    }

    setIsPreparingPaymaster(true)
    try {
      // Estimate gas if not provided
      const estimatedGasLimit = gasLimit || BigInt(500000) // Default estimate
      const maxFeePerGas = BigInt(50000000000) // 50 gwei default
      
      // Calculate gas cost in USDC
      const gasCostInUSDC = estimateGasCostInUSDC(
        estimatedGasLimit,
        maxFeePerGas,
        ethPriceInUSDC
      )
      
      // Check USDC balance
      const hasBalance = await checkUSDCBalance(gasCostInUSDC)
      if (!hasBalance) {
        throw new Error('Insufficient USDC balance for gas payment')
      }
      
      // Prepare paymaster data
      const paymasterData = await preparePaymasterData(
        walletClient,
        publicClient,
        address,
        gasCostInUSDC
      )
      
      // Return transaction with paymaster data
      return {
        transaction: {
          ...transaction,
          // Add paymaster data to transaction
          paymasterAndData: paymasterData.paymasterData
        },
        paymasterData
      }
    } finally {
      setIsPreparingPaymaster(false)
    }
  }, [walletClient, address, publicClient, checkUSDCBalance])

  /**
   * Executes a transaction with optional USDC gas payment
   */
  const executeTransaction = useCallback(async (
    transaction: any,
    options: GaslessTransactionOptions = {}
  ): Promise<Hash | null> => {
    try {
      // Prepare transaction with paymaster if requested
      const { transaction: preparedTx } = await prepareTransaction(
        transaction,
        options
      )
      
      // Execute transaction
      if (options.useUSDCForGas) {
        toast.info('Executing transaction with USDC gas payment...')
      }
      
      // For smart wallets with paymaster, we need to use the smart wallet's sendTransaction
      // This will be handled by Privy's smart wallet integration
      const hash = await walletClient!.sendTransaction(preparedTx)
      
      toast.success('Transaction submitted', {
        description: options.useUSDCForGas 
          ? 'Gas paid with USDC' 
          : 'Transaction sent'
      })
      
      return hash
    } catch (error: any) {
      console.error('Transaction error:', error)
      toast.error('Transaction failed', {
        description: error?.message || 'Unknown error'
      })
      return null
    }
  }, [prepareTransaction, walletClient])

  return {
    prepareTransaction,
    executeTransaction,
    checkUSDCBalance,
    isPreparingPaymaster,
    paymasterConfig: PAYMASTER_CONFIG
  }
}