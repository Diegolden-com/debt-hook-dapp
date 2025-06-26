# CLAUDE.md - Frontend

This file provides guidance to Claude Code (claude.ai/code) when working with the frontend code in this repository.

## Project Overview

This is the Next.js frontend for the DebtHook protocol, providing a user interface for decentralized lending with Uniswap v4 integration. The app enables users to create loan offers, accept loans, and manage their positions.

## Current Development Focus

### Immediate Priorities
1. **Complete Unichain Sepolia Integration**
   - Update chain configuration for Unichain Sepolia
   - Configure correct RPC endpoints and block explorer
   - Test wallet connections on target network

2. **Contract Integration Updates**
   - Ensure ABIs match latest contract changes
   - Update contract addresses after deployment
   - Test all contract interactions thoroughly

3. **User Experience Polish**
   - Add loading states for all async operations
   - Improve error messages with actionable steps
   - Optimize for mobile responsive design

### Testing Checklist
- [ ] Loan offer creation flow
- [ ] Order signing with EIP-712
- [ ] Loan acceptance transaction
- [ ] Position monitoring on dashboard
- [ ] Loan repayment process
- [ ] Real-time updates via Supabase

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

# Contracts
NEXT_PUBLIC_DEBT_HOOK_ADDRESS=
NEXT_PUBLIC_DEBT_ORDER_BOOK_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_WETH_ADDRESS=

# Network
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
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

### Phase B: USDC Paymaster Integration
When implementing the USDC paymaster:
1. Add Smart Wallet SDK (Biconomy/Gelato)
2. Create PaymasterContext provider
3. Update transaction builders to use paymaster
4. Add UI elements showing gas payment in USDC
5. Handle paymaster approval flows

### Phase C: Eigenlayer Integration
For verifiable orderbook:
1. Add orderbook verification status indicators
2. Show proof data for verified orders
3. Implement operator reputation display
4. Add slashing event notifications
5. Create trust score visualizations

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