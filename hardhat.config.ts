import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    // 0.8.24+ is required by OpenZeppelin v5, which SmartWallet uses for
    // EIP-712 and ERC-1271-aware signature checks on invites.
    version: "0.8.24",
    settings: {
      // OpenZeppelin v5 emits `mcopy`, which only exists from Cancun onwards.
      // Sepolia and mainnet have both been on Cancun since Dencun.
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local Ganache instance (the original dev workflow).
    ganache: {
      url: "http://127.0.0.1:7545",
    },
    // `hardhat node` default endpoint.
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Public Sepolia testnet. Secrets come from a git-ignored root .env file —
    // never hardcode them. See .env.example.
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // Enables `npx hardhat verify --network sepolia <address>` after deploy.
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
