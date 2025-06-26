#!/bin/bash

echo "🔄 Updating DebtHook with operator authorization..."

# Load environment variables
source ../unicow/operator/.env

# Export required variables
export PRIVATE_KEY
export TREASURY=$DEBT_HOOK_ADDRESS  # Using hook address as treasury for now

# Run the update script
cd ../blockchain
forge script script/UpdateDebtHook.s.sol \
  --rpc-url https://sepolia.unichain.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://sepolia.uniscan.xyz/api \
  --legacy

echo "✅ DebtHook update complete!"