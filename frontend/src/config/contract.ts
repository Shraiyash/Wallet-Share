import type { Address } from "viem";

// The factory is now the only fixed address the app needs: each user creates
// their own wallet through it, rather than everyone sharing one hard-coded
// contract. Externalised to env so the same build can target Ganache, Hardhat,
// a testnet, or mainnet.
export const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS as Address;

export const factoryAbi = [
  {
    type: "function",
    name: "createWallet",
    inputs: [{ name: "walletName", type: "string" }],
    outputs: [{ name: "wallet", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getWallets",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "walletCount",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "WalletCreated",
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
] as const;

export const factoryContract = {
  address: factoryAddress,
  abi: factoryAbi,
} as const;

// The ABI is declared `as const` so viem/wagmi can fully infer argument and
// return types for every read/write at compile time (no more untyped string
// ABI). Mirrors contracts/SmartWallet.sol :: SmarContracttWallet.
export const walletAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_name", type: "string" },
      { name: "_factory", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isOwner",
    inputs: [{ name: "_addr", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAllowed",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllowedUsers",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVoterList",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userDeposits",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "limits",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "transferFunds",
    inputs: [
      { name: "_to", type: "address" },
      { name: "amountToTransfer", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setLimit",
    inputs: [
      { name: "_whoCanSend", type: "address" },
      { name: "_restriction", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "assignVoter",
    inputs: [{ name: "_voter", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "voteForNewOwner",
    inputs: [{ name: "_newOwner", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAccess",
    inputs: [
      { name: "user", type: "address" },
      { name: "_allowed", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "acceptInvite",
    inputs: [
      { name: "inviteId", type: "bytes32" },
      { name: "expiry", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeInvite",
    inputs: [{ name: "inviteId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "inviteUsed",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsTransferred",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "AccessSet",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "allowed", type: "bool", indexed: false },
    ],
    anonymous: false,
  },
] as const;

// There is no module-level wallet bundle any more: which wallet you are
// looking at is runtime state, so components take it from
// `useWalletContract()` (see context/ActiveWallet.tsx) instead.
