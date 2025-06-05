const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Database
  console.log("Deploying Database...");
  const Database = await ethers.getContractFactory("Database");
  const database = await Database.deploy(deployer.address);
  await database.deployed();
  console.log("Database deployed to:", database.address);

  // Deploy OfficerManagement
  console.log("Deploying OfficerManagement...");
  const OfficerManagement = await ethers.getContractFactory("OfficerManagement");
  const officerManagement = await OfficerManagement.deploy();
  await officerManagement.deployed();
  console.log("OfficerManagement deployed to:", officerManagement.address);

  // Deploy UserAuthentication
  console.log("Deploying UserAuthentication...");
  const UserAuthentication = await ethers.getContractFactory("UserAuthentication");
  const userAuthentication = await UserAuthentication.deploy();
  await userAuthentication.deployed();
  console.log("UserAuthentication deployed to:", userAuthentication.address);

  // Deploy TenderManagement
  console.log("Deploying TenderManagement...");
  const TenderManagement = await ethers.getContractFactory("TenderManagement");
  const tenderManagement = await TenderManagement.deploy();
  await tenderManagement.deployed();
  console.log("TenderManagement deployed to:", tenderManagement.address);

  // Deploy BidManagement
  console.log("Deploying BidManagement...");
  const BidManagement = await ethers.getContractFactory("BidManagement");
  const bidManagement = await BidManagement.deploy(deployer.address);
  await bidManagement.deployed();
  console.log("BidManagement deployed to:", bidManagement.address);

  console.log("All contracts deployed!");
  
  // Save contract addresses
  const addresses = {
    database: database.address,
    officerManagement: officerManagement.address,
    userAuthentication: userAuthentication.address,
    tenderManagement: tenderManagement.address,
    bidManagement: bidManagement.address
  };

  console.log("Contract addresses:", addresses);
  return addresses;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
