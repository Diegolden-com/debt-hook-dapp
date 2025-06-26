import { 
  Address, 
  Hex, 
  maxUint256, 
  parseErc6492Signature,
  TypedDataDomain,
  getContract
} from 'viem';
import { WalletClient, PublicClient } from 'viem';

// EIP-2612 Permit ABI
export const eip2612Abi = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface PermitData {
  types: {
    Permit: readonly {
      name: string;
      type: string;
    }[];
  };
  primaryType: 'Permit';
  domain: TypedDataDomain;
  message: {
    owner: Address;
    spender: Address;
    value: bigint;
    nonce: bigint;
    deadline: bigint;
  };
}

/**
 * Creates EIP-2612 permit data for signing
 */
export async function createPermitData({
  token,
  chainId,
  ownerAddress,
  spenderAddress,
  value,
  client,
}: {
  token: Address;
  chainId: number;
  ownerAddress: Address;
  spenderAddress: Address;
  value: bigint;
  client: PublicClient;
}): Promise<PermitData> {
  const tokenContract = getContract({
    address: token,
    abi: eip2612Abi,
    client,
  });

  const [name, version, nonce] = await Promise.all([
    tokenContract.read.name(),
    tokenContract.read.version(),
    tokenContract.read.nonces([ownerAddress]),
  ]);

  return {
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name,
      version: version || '1',
      chainId,
      verifyingContract: token,
    },
    message: {
      owner: ownerAddress,
      spender: spenderAddress,
      value,
      nonce,
      deadline: maxUint256, // Max deadline for paymaster compatibility
    },
  };
}

/**
 * Signs an EIP-2612 permit
 */
export async function signPermit({
  tokenAddress,
  client,
  walletClient,
  account,
  spenderAddress,
  permitAmount,
}: {
  tokenAddress: Address;
  client: PublicClient;
  walletClient: WalletClient;
  account: Address;
  spenderAddress: Address;
  permitAmount: bigint;
}): Promise<Hex> {
  const permitData = await createPermitData({
    token: tokenAddress,
    chainId: client.chain?.id || 1,
    ownerAddress: account,
    spenderAddress,
    value: permitAmount,
    client,
  });

  const signature = await walletClient.signTypedData({
    account,
    ...permitData,
  });

  // Verify the signature
  const isValid = await client.verifyTypedData({
    ...permitData,
    address: account,
    signature,
  });

  if (!isValid) {
    throw new Error(`Invalid permit signature: ${signature}`);
  }

  // Extract raw signature if it's ERC-6492 wrapped
  const { signature: rawSignature } = parseErc6492Signature(signature);
  return rawSignature;
}