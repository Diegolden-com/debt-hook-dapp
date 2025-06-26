#!/bin/bash

echo "🔗 Connecting DebtOrderBook to ServiceManager"
echo "============================================"

# Check arguments
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide ServiceManager address"
    echo "Usage: ./connect-servicemanager.sh <SERVICE_MANAGER_ADDRESS>"
    exit 1
fi

SERVICE_MANAGER_ADDRESS=$1
DEBT_ORDER_BOOK_ADDRESS="0x5ee61168F53B1eE15ce3620D7bDe05152c634C03" # From your deployment

# Check environment
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: Please set PRIVATE_KEY environment variable"
    exit 1
fi

echo "📝 Configuration:"
echo "  ServiceManager: $SERVICE_MANAGER_ADDRESS"
echo "  DebtOrderBook: $DEBT_ORDER_BOOK_ADDRESS"
echo "  Network: Unichain Sepolia"
echo ""

echo "🔗 Calling setServiceManager..."
cast send $DEBT_ORDER_BOOK_ADDRESS \
  "setServiceManager(address)" \
  $SERVICE_MANAGER_ADDRESS \
  --rpc-url https://sepolia.unichain.org \
  --private-key $PRIVATE_KEY

echo "✅ ServiceManager connected!"
echo ""
echo "📋 Next steps:"
echo "1. Update DebtHook with operator authorization"
echo "2. Configure and start the operator service"