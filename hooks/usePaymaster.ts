import { useState, useCallback, useEffect } from 'react'
import { 
  type Address, 
  type Hex,
  parseUnits,
  formatUnits,
  createPublicClient,
  http
} from 'viem'
import { unichainSepolia } from 'viem/chains'
import { toast } from 'sonner'
import { 
  preparePaymasterData,
  estimateGasCostInUSDC,
  PAYMASTER_CONFIG
} from '@/lib/paymaster/usdc-paymaster'
import { usePrivyWallet } from '@/hooks/use-privy-wallet'

// Current ETH price in USDC (should come from oracle in production)
const ETH_PRICE_USDC = BigInt(3000_000000) // $3000 with 6 decimals

export function usePaymaster() {
  const { address, walletClient } = usePrivyWallet()
  const [isPreparingPaymaster, setIsPreparingPaymaster] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null)
  
  const publicClient = createPublicClient({
    chain: unichainSepolia,
    transport: http()
  })
  
  // Read user's USDC balance
  useEffect(() => {
    async function fetchBalance() {
      if (!address) {
        setUsdcBalance(null)
        return
      }
      
      try {
        const balance = await publicClient.readContract({
          address: PAYMASTER_CONFIG.usdcAddress,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'owner', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }]
            }
          ],
          functionName: 'balanceOf',
          args: [address]
        })
        setUsdcBalance(balance as bigint)
      } catch (error) {
        console.error('Error fetching USDC balance:', error)
      }
    }
    
    fetchBalance()
  }, [address, publicClient])

  // Check if user has enough USDC for gas
  const hasEnoughUSDCForGas = useCallback((estimatedCost: bigint): boolean => {
    if (!usdcBalance) return false
    return usdcBalance >= estimatedCost
  }, [usdcBalance])

  // Estimate gas cost in USDC
  const estimateGasCost = useCallback(async (
    gasLimit: bigint,
    maxFeePerGas?: bigint
  ): Promise<bigint> => {
    try {
      // If maxFeePerGas not provided, estimate it
      if (!maxFeePerGas && publicClient) {
        const feeData = await publicClient.estimateFeesPerGas()
        maxFeePerGas = feeData.maxFeePerGas || BigInt(0)
      }

      if (!maxFeePerGas) {
        throw new Error('Could not estimate gas price')
      }

      // Calculate USDC cost
      const gasCostUSDC = estimateGasCostInUSDC(
        gasLimit,
        maxFeePerGas,
        ETH_PRICE_USDC
      )

      return gasCostUSDC
    } catch (error) {
      console.error('Error estimating gas cost:', error)
      throw error
    }
  }, [publicClient])

  // Prepare paymaster data for a transaction
  const preparePaymaster = useCallback(async (
    estimatedGasLimit: bigint
  ): Promise<{ paymasterData: Hex; permitAmount: bigint } | null> => {
    if (!walletClient || !publicClient || !address) {
      toast.error('Wallet not connected')
      return null
    }

    setIsPreparingPaymaster(true)
    
    try {
      // Estimate gas cost in USDC
      const gasCostUSDC = await estimateGasCost(estimatedGasLimit)
      
      // Check balance
      if (!hasEnoughUSDCForGas(gasCostUSDC)) {
        toast.error(
          `Insufficient USDC for gas. Need ${formatUnits(gasCostUSDC, 6)} USDC`
        )
        return null
      }

      // Prepare paymaster data with permit signature
      const paymasterData = await preparePaymasterData(
        walletClient,
        publicClient,
        address,
        gasCostUSDC
      )

      toast.success('USDC gas payment prepared')
      return paymasterData
    } catch (error) {
      console.error('Error preparing paymaster:', error)
      toast.error('Failed to prepare USDC gas payment')
      return null
    } finally {
      setIsPreparingPaymaster(false)
    }
  }, [walletClient, publicClient, address, estimateGasCost, hasEnoughUSDCForGas])

  return {
    preparePaymaster,
    estimateGasCost,
    hasEnoughUSDCForGas,
    isPreparingPaymaster,
    usdcBalance,
    paymasterConfig: PAYMASTER_CONFIG
  }
}