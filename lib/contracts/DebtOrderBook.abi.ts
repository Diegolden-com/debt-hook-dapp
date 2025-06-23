export const DebtOrderBookABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_debtProtocolAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_usdcAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "debtProtocol",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IDebtProtocol"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "eip712Domain",
    "inputs": [],
    "outputs": [
      {
        "name": "fields",
        "type": "bytes1",
        "internalType": "bytes1"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "version",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "extensions",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "fillLimitOrder",
    "inputs": [
      {
        "name": "order",
        "type": "tuple",
        "internalType": "struct DebtOrderBook.LoanLimitOrder",
        "components": [
          {
            "name": "lender",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "principalAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "collateralRequired",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "interestRateBips",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "maturityTimestamp",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "expiry",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "nonce",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "hashLoanLimitOrder",
    "inputs": [
      {
        "name": "order",
        "type": "tuple",
        "internalType": "struct DebtOrderBook.LoanLimitOrder",
        "components": [
          {
            "name": "lender",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "principalAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "collateralRequired",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "interestRateBips",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "maturityTimestamp",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "expiry",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "nonce",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "usdc",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract ERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "usedNonces",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "OrderCancelled",
    "inputs": [
      {
        "name": "nonce",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OrderFilled",
    "inputs": [
      {
        "name": "orderHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "borrower",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "principalAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const;