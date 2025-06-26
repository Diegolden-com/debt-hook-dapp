import { 
  createPublicClient, 
  http, 
  type Address, 
  type Hex,
  encodePacked,
  maxUint256
} from 'viem'
import { signTypedData } from 'viem/accounts'
import type { WalletClient } from 'viem'

// USDC Paymaster configuration
export const PAYMASTER_CONFIG = {
  // Circle USDC Paymaster on Arbitrum Sepolia (update for your network)
  paymasterAddress: '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966' as Address,
  // USDC address on the network
  usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address,
  // EIP-2612 permit typehash
  permitTypehash: '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9' as Hex
}

// EIP-2612 Permit types for USDC
export const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
}

// Interface for paymaster data
export interface PaymasterData {
  paymasterData: Hex
  permitAmount: bigint
}

/**
 * Creates USDC permit signature for paymaster
 * @param walletClient - Viem wallet client
 * @param owner - Address of the USDC owner
 * @param spender - Address allowed to spend USDC (paymaster)
 * @param value - Amount of USDC to permit
 * @param nonce - Current permit nonce
 * @param deadline - Permit deadline (defaults to max uint256)
 */
export async function createUSDCPermit(
  walletClient: WalletClient,
  owner: Address,
  spender: Address,
  value: bigint,
  nonce: bigint,
  deadline: bigint = maxUint256
): Promise<Hex> {
  // Get USDC domain separator
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: walletClient.chain?.id || 84532, // Default to Base Sepolia
    verifyingContract: PAYMASTER_CONFIG.usdcAddress
  }

  // Sign permit
  const signature = await walletClient.signTypedData({
    account: owner,
    domain,
    types: PERMIT_TYPES,
    primaryType: 'Permit',
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline
    }
  })

  return signature
}

/**
 * Encodes paymaster data for Circle USDC Paymaster
 * @param permitAmount - Amount of USDC to permit for gas payment
 * @param permitSignature - EIP-2612 permit signature
 */
export function encodePaymasterData(
  permitAmount: bigint,
  permitSignature: Hex
): Hex {
  // Circle Paymaster expects:
  // - uint8 flag (0 for USDC payment)
  // - address token (USDC address)
  // - uint256 amount
  // - bytes signature
  return encodePacked(
    ['uint8', 'address', 'uint256', 'bytes'],
    [0, PAYMASTER_CONFIG.usdcAddress, permitAmount, permitSignature]
  )
}

/**
 * Estimates gas cost in USDC
 * @param gasLimit - Estimated gas limit
 * @param maxFeePerGas - Max fee per gas in wei
 * @param ethPriceInUSDC - Current ETH price in USDC (6 decimals)
 */
export function estimateGasCostInUSDC(
  gasLimit: bigint,
  maxFeePerGas: bigint,
  ethPriceInUSDC: bigint
): bigint {
  // Calculate gas cost in wei
  const gasCostInWei = gasLimit * maxFeePerGas
  
  // Convert to USDC (accounting for decimals: ETH=18, USDC=6)
  // gasCostInUSDC = (gasCostInWei * ethPriceInUSDC) / 10^18
  const gasCostInUSDC = (gasCostInWei * ethPriceInUSDC) / BigInt(1e18)
  
  // Add 10% buffer for price fluctuations
  return (gasCostInUSDC * BigInt(110)) / BigInt(100)
}

/**
 * Gets current USDC permit nonce for an address
 * @param publicClient - Viem public client
 * @param owner - Address to check nonce for
 */
export async function getUSDCPermitNonce(
  publicClient: any,
  owner: Address
): Promise<bigint> {
  const nonce = await publicClient.readContract({
    address: PAYMASTER_CONFIG.usdcAddress,
    abi: [
      {
        name: 'nonces',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'nonces',
    args: [owner]
  })

  return nonce as bigint
}

/**
 * Prepares paymaster data for a transaction
 * @param walletClient - Viem wallet client
 * @param publicClient - Viem public client
 * @param userAddress - User's address
 * @param estimatedGasCost - Estimated gas cost in USDC
 */
export async function preparePaymasterData(
  walletClient: WalletClient,
  publicClient: any,
  userAddress: Address,
  estimatedGasCost: bigint
): Promise<PaymasterData> {
  // Get current permit nonce
  const nonce = await getUSDCPermitNonce(publicClient, userAddress)
  
  // Create permit signature
  const permitSignature = await createUSDCPermit(
    walletClient,
    userAddress,
    PAYMASTER_CONFIG.paymasterAddress,
    estimatedGasCost,
    nonce
  )
  
  // Encode paymaster data
  const paymasterData = encodePaymasterData(estimatedGasCost, permitSignature)
  
  return {
    paymasterData,
    permitAmount: estimatedGasCost
  }
}