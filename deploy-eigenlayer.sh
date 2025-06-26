#!/bin/bash

echo "🚀 Deploying EigenLayer AVS for DebtHook Protocol"
echo "================================================"

# Check if environment variables are set
if [ -z "$ETHEREUM_SEPOLIA_RPC" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: Please set ETHEREUM_SEPOLIA_RPC and PRIVATE_KEY environment variables"
    echo "Example:"
    echo "  export ETHEREUM_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
    echo "  export PRIVATE_KEY=your_private_key_without_0x"
    exit 1
fi

# Navigate to AVS directory
cd ../unicow/avs

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
ETHEREUM_SEPOLIA_RPC=$ETHEREUM_SEPOLIA_RPC
PRIVATE_KEY=$PRIVATE_KEY
ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY
EOF
fi

echo "📦 Installing dependencies..."
forge install

echo "🔨 Building contracts..."
forge build

echo "🚀 Deploying ServiceManager to Ethereum Sepolia..."
forge script script/DeployToSepolia.s.sol:DeployToSepolia \
  --rpc-url $ETHEREUM_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Note the deployed ServiceManager address from the output above"
echo "2. Run: ./connect-servicemanager.sh <SERVICE_MANAGER_ADDRESS>"
echo "3. Update DebtHook with operator authorization"
echo "4. Start the operator service"