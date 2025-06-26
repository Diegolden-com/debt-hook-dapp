#!/bin/bash

echo "🤖 Setting up DebtHook Operator"
echo "==============================="

# Check arguments
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide ServiceManager address"
    echo "Usage: ./setup-operator.sh <SERVICE_MANAGER_ADDRESS>"
    exit 1
fi

SERVICE_MANAGER_ADDRESS=$1

# Navigate to operator directory
cd ../unicow/operator

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing operator dependencies..."
    npm install
fi

# Create .env file
echo "📝 Creating operator .env file..."
cat > .env << EOF
# Ethereum Sepolia (for registration)
ETHEREUM_RPC_URL=${ETHEREUM_SEPOLIA_RPC:-https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY}
DELEGATION_MANAGER_ADDRESS=0xA44151489861Fe9e3055d95adC98FbD462B948e7
AVS_DIRECTORY_ADDRESS=0x055733000064333CaDDbC92763c58BF0192fFeBf

# Your ServiceManager from deployment
SERVICE_MANAGER_ADDRESS=$SERVICE_MANAGER_ADDRESS

# Unichain Sepolia (for loan execution)
UNICHAIN_RPC_URL=https://sepolia.unichain.org
DEBT_HOOK_ADDRESS=0x3e0d85C587683c96aDD88b4D3588404736b5E02f
DEBT_ORDER_BOOK_ADDRESS=0x5ee61168F53B1eE15ce3620D7bDe05152c634C03

# Operator private key (CHANGE THIS!)
OPERATOR_PRIVATE_KEY=${OPERATOR_PRIVATE_KEY:-your_operator_private_key}
EOF

echo ""
echo "⚠️  IMPORTANT: Edit ../unicow/operator/.env and set OPERATOR_PRIVATE_KEY"
echo ""
echo "📋 Next steps:"
echo "1. cd ../unicow/operator"
echo "2. Edit .env file with your operator private key"
echo "3. npm run register-operator"
echo "4. npm run start"
echo ""
echo "After starting the operator:"
echo "1. Authorize operator address in DebtHook"
echo "2. Submit test orders to see matching in action"