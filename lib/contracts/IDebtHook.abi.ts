export const IDebtHookABI = [
  {
    "type": "function",
    "name": "createLoan",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "internalType": "struct IDebtHook.CreateLoanParams",
        "components": [
          {
            "name": "lender",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "borrower",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "principalAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "collateralAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "maturityTimestamp",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "interestRateBips",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "loanId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "payable"
  }
] as const;