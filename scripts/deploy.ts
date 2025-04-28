import { ethers } from "hardhat";
import { TenderManager } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const TenderManager = await ethers.getContractFactory("TenderManager");
  const tenderManager = await TenderManager.deploy();
  
  await tenderManager.deployed();
  
  console.log("TenderManager deployed to:", tenderManager.address);

  // Verify contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: tenderManager.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 