import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Deploys the factory, not a wallet.
 *
 * The app used to point at one hard-coded wallet, which meant every visitor
 * landed on the deployer's wallet asking to be let in. Now each signup creates
 * their own wallet through this factory, so the only address the frontend needs
 * is the factory's.
 */
async function main() {
  const Factory = await ethers.getContractFactory("WalletShareFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const info = {
    contract: "WalletShareFactory",
    network: network.name,
    chainId,
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  // Persist the deployment so the address is never lost (one file per network).
  const dir = join(__dirname, "..", "deployments");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${network.name}.json`), JSON.stringify(info, null, 2) + "\n");

  console.log("\n✅ WalletShareFactory deployed");
  console.log("   Network :", info.network, `(chainId ${chainId})`);
  console.log("   Address :", address);
  console.log("   Deployer:", deployer.address);
  console.log("   Saved   :", `deployments/${network.name}.json`);

  console.log("\n👉 Put these in frontend/.env (local dev) AND in the Vercel dashboard:");
  console.log(`   VITE_FACTORY_ADDRESS=${address}`);
  console.log(`   VITE_CHAIN_ID=${chainId}`);

  if (network.name === "sepolia") {
    console.log("\n🔎 To verify the source on Sepolia Etherscan (optional):");
    console.log(`   npx hardhat verify --network sepolia ${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
