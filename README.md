# DebtHook Frontend (Humane Banque)

*The DeFi lending interface for DebtHook Protocol*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-humane-banque.vercel.app)

## Overview

This is the Next.js frontend application for DebtHook Protocol, providing a user-friendly interface for:
- Creating and browsing loan offers
- Managing lending and borrowing positions
- Monitoring loan health and liquidations
- Integrating with EigenLayer AVS for optimized order matching

## Current Deployment (June 26, 2025)

**Live URL**: [https://v0-humane-banque.vercel.app](https://v0-humane-banque.vercel.app)

### Connected Contracts

#### Unichain Sepolia
- **DebtHook**: `0x49e39eFDE0C93F6601d84cb5C6D24c1B23eB00C8`
- **DebtOrderBook**: `0xce060483D67b054cACE5c90001992085b46b4f66`
- **USDC**: `0x73CFC55f831b5DD6E5Ee4CEF02E8c05be3F069F6`

#### Ethereum Sepolia
- **ServiceManager**: `0x3333Bc77EdF180D81ff911d439F02Db9e34e8603`

## Features

### For Lenders
- Create loan offers with custom terms (amount, rate, duration)
- Sign orders off-chain (gasless via EIP-712)
- View and manage active loans
- Track interest earnings

### For Borrowers
- Browse available loan offers
- Filter by amount, rate, and duration
- Accept loans with one-click execution
- Monitor collateral health factor
- Repay loans before maturity

### Advanced Features
- **Batch Matching**: Submit orders to EigenLayer AVS for optimal rate discovery
- **Real-time Updates**: Supabase integration for live order book
- **Smart Wallet Support**: Works with both EOAs and account abstraction wallets
- **Mobile Responsive**: Full functionality on all devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui
- **Web3**: Privy (wallet connection), Viem (contract interactions)
- **Database**: Supabase for off-chain order storage
- **Deployment**: Vercel

## Development

### Prerequisites
- Node.js v18+
- pnpm package manager
- Environment variables (see `.env.example`)

### Local Setup

```bash
# Clone the repository
git clone <repo-url>
cd debt-hook/dapp

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Contract Addresses (Unichain Sepolia)
NEXT_PUBLIC_DEBT_HOOK_ADDRESS=0x49e39eFDE0C93F6601d84cb5C6D24c1B23eB00C8
NEXT_PUBLIC_DEBT_ORDER_BOOK_ADDRESS=0xce060483D67b054cACE5c90001992085b46b4f66
NEXT_PUBLIC_USDC_ADDRESS=0x73CFC55f831b5DD6E5Ee4CEF02E8c05be3F069F6

# EigenLayer (Ethereum Sepolia)
NEXT_PUBLIC_SERVICE_MANAGER_ADDRESS=0x3333Bc77EdF180D81ff911d439F02Db9e34e8603

# Network
NEXT_PUBLIC_CHAIN_ID=1301
NEXT_PUBLIC_RPC_URL=https://sepolia.unichain.org
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
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities and hooks
│   ├── contracts/        # Contract ABIs and addresses
│   ├── hooks/            # Custom React hooks
│   └── supabase/         # Supabase client
└── public/               # Static assets
```

## Key User Flows

### Creating a Loan Offer (Lender)
1. Connect wallet via Privy
2. Navigate to Market page
3. Click "Create Offer"
4. Set terms (amount, rate, duration)
5. Sign EIP-712 message
6. Order stored in Supabase

### Accepting a Loan (Borrower)
1. Browse available offers
2. Filter/sort as needed
3. Click "Accept" on desired offer
4. Approve USDC (if needed)
5. Confirm transaction
6. Deposit collateral

### Batch Order Submission
1. Create order with flexible parameters
2. Choose "Submit to AVS" option
3. Order sent to EigenLayer ServiceManager
4. Operator matches and executes
5. Receive notification of match

## Deployment

### Vercel Deployment

The app is automatically deployed via Vercel:

```bash
# Manual deployment
vercel --prod

# Environment variables must be set in Vercel dashboard
```

### Build Commands

```bash
# Build for production
pnpm build

# Run production build locally
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# E2E tests
pnpm test:e2e
```

## Security Considerations

- All contract interactions are validated client-side
- EIP-712 signatures prevent order tampering
- Supabase RLS policies protect user data
- Environment variables never exposed to client
- CORS properly configured for API routes

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   - Clear browser cache
   - Check Privy app ID
   - Verify chain configuration

2. **Transaction Failures**
   - Ensure sufficient gas
   - Check token approvals
   - Verify contract addresses

3. **Order Not Appearing**
   - Check Supabase connection
   - Verify signature format
   - Check browser console for errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT