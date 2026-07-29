import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const Wallet = await ethers.getContractFactory("SmarContracttWallet");
  const wallet = await Wallet.deploy();
  await wallet.waitForDeployment();

  const address = await wallet.getAddress();
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const info = {
    contract: "SmarContracttWallet",
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

  console.log("\n✅ SmarContracttWallet deployed");
  console.log("   Network :", info.network, `(chainId ${chainId})`);
  console.log("   Address :", address);
  console.log("   Owner   :", deployer.address);
  console.log("   Saved   :", `deployments/${network.name}.json`);

  console.log("\n👉 Put these in frontend/.env (local dev) AND in the Vercel dashboard:");
  console.log(`   VITE_CONTRACT_ADDRESS=${address}`);
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
