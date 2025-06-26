#!/bin/bash

echo "🧪 Testing batch loan creation..."
echo "Note: The current DebtHook doesn't have operator authorization implemented,"
echo "so we'll test with a mock transaction that would normally come from the operator."

# Load environment variables
source ../unicow/operator/.env

# Create a simple test script
cat > ../blockchain/script/TestBatchLoans.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IDebtHook} from "../src/interfaces/IDebtHook.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

contract TestBatchLoans is Script {
    address constant DEBT_HOOK = 0x0C075a62FD69EA6Db1F65566911C4f1D221e40c8;
    address constant USDC = 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Testing batch loan creation from:", deployer);
        console.log("Note: This will fail with 'not authorized' which proves our update is needed!");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Create a test match
        IDebtHook.LoanMatch[] memory matches = new IDebtHook.LoanMatch[](1);
        matches[0] = IDebtHook.LoanMatch({
            lender: deployer,
            borrower: address(0x1234), // Test borrower
            principalAmount: 1000 * 1e6, // 1000 USDC
            interestRateBips: 500, // 5% APR
            maturityTimestamp: block.timestamp + 30 days
        });
        
        // First approve USDC
        console.log("Approving USDC...");
        IERC20(USDC).approve(DEBT_HOOK, 1000 * 1e6);
        
        // Try to create batch loans (should fail without authorization)
        console.log("Attempting batch loan creation...");
        try IDebtHook(DEBT_HOOK).createBatchLoans(matches, "") {
            console.log("✅ Batch loans created successfully!");
        } catch Error(string memory reason) {
            console.log("❌ Expected error:", reason);
            console.log("This confirms we need operator authorization!");
        }
        
        vm.stopBroadcast();
    }
}
EOF

echo "Running test script..."
cd ../blockchain
forge script script/TestBatchLoans.s.sol \
  --rpc-url https://sepolia.unichain.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvv

echo "✅ Test complete!"