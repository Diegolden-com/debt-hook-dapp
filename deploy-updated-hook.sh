#!/bin/bash

echo "🚀 Deploying Updated DebtHook with Operator Authorization..."

# Load environment variables
source ../unicow/operator/.env

# Export required variables
export PRIVATE_KEY

echo "Step 1: Deploying new DebtHook with operator authorization..."
cd ../blockchain

# Run the deployment
forge script script/DeployHook.s.sol \
  --rpc-url https://sepolia.unichain.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://sepolia.uniscan.xyz/api \
  --legacy \
  -vvv

echo "✅ Deployment complete! Check the output above for new addresses."
echo ""
echo "Next steps:"
echo "1. Update README.md with new DebtHook and DebtOrderBook addresses"
echo "2. Update unicow/operator/.env with new addresses"
echo "3. Update dapp/.env.local with new addresses"
echo "4. Restart the operator"