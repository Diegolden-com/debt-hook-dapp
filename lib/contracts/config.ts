import { DebtHookABI, DebtOrderBookABI, ERC20ABI } from './index'
import { Address } from 'viem'
import { baseSepolia, localhost } from 'viem/chains'

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532')
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// Use localhost chain for local development
export const chain = CHAIN_ID === 31337 ? localhost : baseSepolia

export const contracts = {
  debtHook: {
    address: (process.env.NEXT_PUBLIC_DEBT_PROTOCOL_ADDRESS || process.env.NEXT_PUBLIC_DEBT_HOOK_ADDRESS || '0x0') as Address,
    abi: DebtHookABI,
  },
  debtOrderBook: {
    address: (process.env.NEXT_PUBLIC_DEBT_ORDER_BOOK_ADDRESS || '0x0') as Address,
    abi: DebtOrderBookABI,
  },
  usdc: {
    address: (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0') as Address,
    abi: ERC20ABI,
  },
  weth: {
    address: (process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x0') as Address,
    abi: ERC20ABI,
  },
  priceFeed: {
    address: (process.env.NEXT_PUBLIC_ETH_PRICE_FEED_ADDRESS || '0x0') as Address,
    abi: [] as const, // We'll add this if needed
  },
} as const

// EIP-712 Domain for order signing
export const EIP712_DOMAIN = {
  name: 'DebtOrderBook',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: contracts.debtOrderBook.address,
} as const

// Loan Order Types for EIP-712
export const LOAN_ORDER_TYPES = {
  LoanOrder: [
    { name: 'lender', type: 'address' },
    { name: 'collateralAmount', type: 'uint256' },
    { name: 'loanAmount', type: 'uint256' },
    { name: 'interestRate', type: 'uint256' },
    { name: 'duration', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const