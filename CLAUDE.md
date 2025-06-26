# CLAUDE.md - Frontend

This file provides guidance to Claude Code (claude.ai/code) when working with the frontend code in this repository.

## Project Overview

This is the Next.js frontend for the DebtHook protocol, providing a user interface for decentralized lending with Uniswap v4 integration. The app enables users to create loan offers, accept loans, and manage their positions.

## Current Status (June 26, 2025)

### ✅ Deployed Contracts
The frontend is now connected to the fully deployed protocol:

#### Unichain Sepolia
- **DebtHook**: `0x49e39eFDE0C93F6601d84cb5C6D24c1B23eB00C8` (with operator authorization)
- **DebtOrderBook**: `0xce060483D67b054cACE5c90001992085b46b4f66`
- **USDC**: `0x73CFC55f831b5DD6E5Ee4CEF02E8c05be3F069F6`

#### Ethereum Sepolia
- **ServiceManager**: `0x3333Bc77EdF180D81ff911d439F02Db9e34e8603`

### Testing Priorities
- [x] Unichain Sepolia integration complete
- [x] Contract addresses updated
- [ ] Test loan offer creation flow
- [ ] Test EigenLayer AVS order submission
- [ ] Test batch loan matching
- [ ] Verify real-time updates via Supabase

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Web3**: Privy for wallet connections, Viem for contract interactions
- **Backend**: Supabase for off-chain order storage and real-time updates
- **State Management**: React hooks and context

## Common Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Type checking
pnpm typecheck
```

## Project Structure

```
dapp/
├── app/                    # Next.js app router pages
│   ├── market/            # Loan marketplace
│   ├── dashboard/         # Position management
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── market/           # Market-specific components
│   ├── dashboard/        # Dashboard components
│   └── common/           # Shared components
├── lib/                   # Utilities and hooks
│   ├── contracts/        # Contract ABIs and addresses
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client and types
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## Key User Flows

### 1. Lender Creates Offer (Off-chain)
- User connects wallet via Privy
- Fills out loan terms in CreateOfferModal
- Signs EIP-712 message with loan parameters
- Offer stored in Supabase with signature

### 2. Borrower Accepts Offer (On-chain)
- Browses available offers in OrderBookTable
- Filters by amount, rate, duration
- Clicks "Accept" to trigger on-chain transaction
- DebtOrderBook contract validates and executes

### 3. Position Management
- Dashboard shows all active loans
- Separate views for borrower/lender roles
- Real-time updates via Supabase subscriptions
- Actions: repay loans, monitor health factor

### 4. Loan Repayment
- Two-step process: approve USDC, then repay
- Shows current debt with accrued interest
- Updates position status on completion

## Component Architecture

### Core Components

1. **ConnectWalletButton**: Privy integration for wallet connection
2. **OrderBookTable**: Displays loan offers with filtering/sorting
3. **CreateOfferModal**: Form for lenders to create signed orders
4. **LoanCard**: Shows individual loan details with actions
5. **HealthFactorIndicator**: Visual representation of loan health

### Custom Hooks

- `useDebtHook`: Contract interactions for loans
- `useOrderBook`: Supabase order management
- `useUserPositions`: Fetches user's loans
- `usePrices`: ETH/USDC price feeds

## Environment Variables

Required in `.env.local`:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Contracts (Unichain Sepolia)
NEXT_PUBLIC_DEBT_HOOK_ADDRESS=0x49e39eFDE0C93F6601d84cb5C6D24c1B23eB00C8
NEXT_PUBLIC_DEBT_ORDER_BOOK_ADDRESS=0xce060483D67b054cACE5c90001992085b46b4f66
NEXT_PUBLIC_USDC_ADDRESS=0x73CFC55f831b5DD6E5Ee4CEF02E8c05be3F069F6
NEXT_PUBLIC_WETH_ADDRESS=0x0000000000000000000000000000000000000000

# EigenLayer (Ethereum Sepolia)
NEXT_PUBLIC_SERVICE_MANAGER_ADDRESS=0x3333Bc77EdF180D81ff911d439F02Db9e34e8603

# Network
NEXT_PUBLIC_CHAIN_ID=1301
NEXT_PUBLIC_RPC_URL=https://sepolia.unichain.org
```

## Development Guidelines

### 1. Component Development
- Use shadcn/ui components as base
- Follow composition pattern
- Keep components focused and reusable
- Use TypeScript for all components

### 2. Contract Integration
- ABIs stored in `lib/contracts/abis/`
- Use Viem for all contract calls
- Handle errors gracefully with toast notifications
- Show loading states during transactions

### 3. Data Management
- Supabase for off-chain data
- On-chain data fetched directly via Viem
- Combine both sources in dashboard views
- Use React Query for caching (if needed)

### 4. Error Handling
- Display user-friendly error messages
- Log technical details to console
- Provide clear next steps for users
- Handle wallet connection errors

### 5. Performance
- Lazy load heavy components
- Optimize images with Next.js Image
- Minimize contract calls
- Use Supabase real-time selectively

## Testing Approach

- Unit tests for utility functions
- Component testing with React Testing Library
- E2E tests for critical user flows
- Mock contract interactions in tests

## Security Considerations

- Never expose private keys
- Validate all user inputs
- Sanitize data from Supabase
- Use environment variables for sensitive data
- Implement proper CORS policies

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Environment Setup
- Set all environment variables in Vercel dashboard
- Enable Supabase Row Level Security
- Configure custom domain with SSL
- Set up monitoring (Vercel Analytics recommended)

## Future Enhancements (Aligned with Protocol Roadmap)

### Phase B: USDC Paymaster Integration ✅ IMPLEMENTED
**Smart Contract Ready** - Frontend integration pending:
1. CirclePaymaster contract deployed and tested
2. EIP-4337 compliant with EntryPoint integration
3. Supports gasless USDC approvals via EIP-2612 permits
4. Dynamic pricing mechanism for USDC to gas conversion
5. Ready for Smart Wallet SDK integration (Biconomy/Gelato)

### Phase C: EigenLayer Integration ✅ READY TO TEST
The EigenLayer AVS is now deployed and operational:
1. Add "Submit to AVS" option in order creation
2. Show batch matching status for orders
3. Display operator verification badges
4. Add notifications for matched orders
5. Show estimated wait time for batch execution

## Troubleshooting Common Issues

### Wallet Connection Issues
- Clear Privy cache: `localStorage.clear()`
- Check chain ID matches deployment
- Verify RPC endpoint is responsive

### Transaction Failures
- Check user has sufficient balance
- Verify contract addresses are correct
- Ensure proper token approvals
- Check gas estimation isn't failing

### Supabase Real-time Issues
- Verify anon key has proper permissions
- Check Row Level Security policies
- Ensure WebSocket connections aren't blocked
- Monitor Supabase dashboard for errors