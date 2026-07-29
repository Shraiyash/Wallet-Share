import type { Address } from "viem";

// Single source of truth for the deployed contract address. Externalised to
// env so the same build can target Ganache, Hardhat, a testnet, or mainnet.
export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as Address;

// The ABI is declared `as const` so viem/wagmi can fully infer argument and
// return types for every read/write at compile time (no more untyped string
// ABI). Mirrors contracts/SmartWallet.sol :: SmarContracttWallet.
export const walletAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
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

// Convenience bundle for wagmi hooks: `useReadContract({ ...walletContract, ... })`.
export const walletContract = {
  address: contractAddress,
  abi: walletAbi,
} as const;
