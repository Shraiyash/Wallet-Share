import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain, http, type Chain } from "viem";
import { mainnet, sepolia } from "wagmi/chains";

const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? 1337);
const rpcUrl = import.meta.env.VITE_RPC_URL;

// Resolve the single chain this build targets, driven entirely by env:
//   VITE_CHAIN_ID=11155111 -> Sepolia (public testnet)
//   VITE_CHAIN_ID=1        -> Ethereum mainnet
//   anything else          -> a local dev chain (Ganache 7545 / Hardhat 8545)
// Using the built-in chain objects for public networks gives us correct block
// explorers, ENS, etc., and avoids defining a second chain with a clashing id.
function resolveChain(): Chain {
  if (chainId === sepolia.id) return sepolia;
  if (chainId === mainnet.id) return mainnet;
  return defineChain({
    id: chainId,
    name: "Local Wallet Share Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl ?? "http://127.0.0.1:7545"] },
    },
  });
}

const activeChain = resolveChain();
const chains: readonly [Chain, ...Chain[]] = [activeChain];

export const wagmiConfig = getDefaultConfig({
  appName: "Wallet Share",
  // Required by RainbowKit / WalletConnect. Injected wallets (MetaMask) work
  // without a valid id, but a live public URL should set a real one from
  // https://cloud.walletconnect.com (VITE_WALLETCONNECT_PROJECT_ID).
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "PLACEHOLDER",
  chains,
  // Route contract reads through the env RPC (your Alchemy/Infura endpoint on
  // Sepolia, or Ganache locally). Falls back to the chain's default transport.
  transports: {
    [activeChain.id]: rpcUrl ? http(rpcUrl) : http(),
  },
  ssr: false,
});
