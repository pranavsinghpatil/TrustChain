const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting deployment process...");
  
  // Deploy UserAuthentication contract first
  console.log("Deploying UserAuthentication contract...");
  const UserAuthentication = await hre.ethers.getContractFactory("UserAuthentication");
  const userAuthentication = await UserAuthentication.deploy();
  await userAuthentication.deployed();
  console.log("UserAuthentication contract deployed to:", userAuthentication.address);
  
  // Deploy OfficerManagement contract
  console.log("Deploying OfficerManagement contract...");
  const OfficerManagement = await hre.ethers.getContractFactory("OfficerManagement");
  const officerManagement = await OfficerManagement.deploy();
  await officerManagement.deployed();
  console.log("OfficerManagement contract deployed to:", officerManagement.address);
  
  // Deploy TenderManagement contract
  console.log("Deploying TenderManagement contract...");
  const TenderManagement = await hre.ethers.getContractFactory("TenderManagement");
  const tenderManagement = await TenderManagement.deploy();
  await tenderManagement.deployed();
  console.log("TenderManagement contract deployed to:", tenderManagement.address);
  
  console.log("All contracts deployed successfully!");
  console.log("Contract Addresses:");
  console.log("UserAuthentication:", userAuthentication.address);
  console.log("OfficerManagement:", officerManagement.address);
  console.log("TenderManagement:", tenderManagement.address);
  
  // Save the contract addresses to a file for easy access
  const contractAddresses = {
    UserAuthentication: userAuthentication.address,
    OfficerManagement: officerManagement.address,
    TenderManagement: tenderManagement.address
  };
  
  fs.writeFileSync(
    "src/contracts/addresses.json",
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("Contract addresses saved to src/contracts/addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });