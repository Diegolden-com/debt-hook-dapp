#!/bin/bash

echo "🔄 Updating DebtOrderBook with new DebtHook address..."

# Load environment variables
source ../unicow/operator/.env

# New DebtHook address
NEW_DEBT_HOOK=0x49e39eFDE0C93F6601d84cb5C6D24c1B23eB00C8
DEBT_ORDER_BOOK=0xce060483D67b054cACE5c90001992085b46b4f66

echo "Current DebtOrderBook: $DEBT_ORDER_BOOK"
echo "New DebtHook: $NEW_DEBT_HOOK"

# We need to deploy a new DebtOrderBook that points to the new DebtHook
cat > ../blockchain/script/UpdateOrderBook.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DebtOrderBook} from "../src/DebtOrderBook.sol";

contract UpdateOrderBook is Script {
    address constant NEW_DEBT_HOOK = 0x49e39eFDE0C93F6601d84cb5C6D24c1B23eB00C8;
    address constant USDC = 0x73CFC55f831b5DD6E5Ee4CEF02E8c05be3F069F6;
    address constant SERVICE_MANAGER = 0x3333Bc77EdF180D81ff911d439F02Db9e34e8603;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Deploying new DebtOrderBook...");
        console.log("DebtHook:", NEW_DEBT_HOOK);
        console.log("USDC:", USDC);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new OrderBook pointing to new DebtHook
        DebtOrderBook orderBook = new DebtOrderBook(NEW_DEBT_HOOK, USDC);
        console.log("New DebtOrderBook deployed:", address(orderBook));
        
        // Set ServiceManager
        orderBook.setServiceManager(SERVICE_MANAGER);
        console.log("ServiceManager set:", SERVICE_MANAGER);
        
        vm.stopBroadcast();
        
        console.log("\nDEPLOYMENT COMPLETE!");
        console.log("DebtOrderBook:", address(orderBook));
    }
}
EOF

echo "Deploying new DebtOrderBook..."
PRIVATE_KEY=0x$OPERATOR_PRIVATE_KEY forge script ../blockchain/script/UpdateOrderBook.s.sol:UpdateOrderBook \
  --root ../blockchain \
  --rpc-url https://sepolia.unichain.org \
  --broadcast \
  -vvv

echo "✅ DebtOrderBook update complete!"