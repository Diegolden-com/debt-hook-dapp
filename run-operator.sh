#!/bin/bash

echo "🤖 Starting DebtHook Operator..."

# Load environment variables
source ../unicow/operator/.env

# Export required variables
export PRIVATE_KEY
export SERVICE_MANAGER_ADDRESS
export ETHEREUM_RPC_URL
export UNICHAIN_RPC_URL
export DEBT_HOOK_ADDRESS
export DEBT_ORDER_BOOK_ADDRESS

# Run the simple operator
cd ../unicow/operator
npx tsx simple-operator.ts