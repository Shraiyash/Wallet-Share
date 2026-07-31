import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain, mainnet, sepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit-common";
import { http } from "viem";

const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? 1337);
const rpcUrl = import.meta.env.VITE_RPC_URL;

// Required by AppKit / WalletConnect, and — unlike before — no longer optional:
// social and email sign-in are hosted by Reown, so a real id from
// https://cloud.reown.com is what makes "Continue with Google" work at all.
// An unset var in a dashboard often arrives as "" rather than undefined, so
// trim and treat blank as missing.
export const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim() || "";

if (!walletConnectProjectId) {
  console.warn(
    "[Wallet Share] VITE_WALLETCONNECT_PROJECT_ID is not set — social and " +
      "email sign-in are unavailable. Injected wallets (MetaMask) still work.",
  );
}

// Resolve the single chain this build targets, driven entirely by env:
//   VITE_CHAIN_ID=11155111 -> Sepolia (public testnet)
//   VITE_CHAIN_ID=1        -> Ethereum mainnet
//   anything else          -> a local dev chain (Ganache 7545 / Hardhat 8545)
// Using the built-in network objects for public chains gives us correct block
// explorers, ENS, etc., and avoids defining a second chain with a clashing id.
function resolveNetwork(): AppKitNetwork {
  if (chainId === sepolia.id) return sepolia;
  if (chainId === mainnet.id) return mainnet;
  return defineChain({
    id: chainId,
    caipNetworkId: `eip155:${chainId}`,
    chainNamespace: "eip155",
    name: "Local Wallet Share Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl ?? "http://127.0.0.1:7545"] },
    },
  });
}

export const appKitNetwork = resolveNetwork();
export const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [appKitNetwork];

// The adapter owns the wagmi config now, so every existing wagmi hook
// (useReadContract, useWriteContract, …) keeps working unchanged while AppKit
// supplies the connectors — including the hosted social/email ones.
export const wagmiAdapter = new WagmiAdapter({
  networks: appKitNetworks,
  projectId: walletConnectProjectId || "PLACEHOLDER",
  // Route contract reads through the env RPC (your Alchemy/Infura endpoint on
  // Sepolia, or Ganache locally). Falls back to the chain's default transport.
  transports: {
    [Number(appKitNetwork.id)]: rpcUrl ? http(rpcUrl) : http(),
  },
  ssr: false,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
