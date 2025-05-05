// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Use deployer as admin if not specified
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || deployer.address;

  // Deploy AdminManagement contract
  const AdminManagement = await hre.ethers.getContractFactory("AdminManagement");
  const adminManagement = await AdminManagement.deploy(ADMIN_ADDRESS);
  await adminManagement.deployed();
  console.log(`AdminManagement deployed to ${adminManagement.address}`);
  
  // Deploy OfficerManagement (no constructor args)
  const OfficerManagement = await hre.ethers.getContractFactory("OfficerManagement");
  const officerManagement = await OfficerManagement.deploy();
  await officerManagement.deployed();
  console.log(`OfficerManagement deployed to ${officerManagement.address}`);
  
  // Deploy UserAuthentication (no constructor args)
  const UserAuthentication = await hre.ethers.getContractFactory("UserAuthentication");
  const userAuthentication = await UserAuthentication.deploy();
  await userAuthentication.deployed();
  console.log(`UserAuthentication deployed to ${userAuthentication.address}`);
  
  // Deploy TenderManagement (no constructor args)
  const TenderManagement = await hre.ethers.getContractFactory("TenderManagement");
  const tenderManagement = await TenderManagement.deploy();
  await tenderManagement.deployed();
  console.log(`TenderManagement deployed to ${tenderManagement.address}`);
  
  // Save the contract addresses to a file for the frontend to use
  const contractsConfig = {
    OFFICER_MANAGEMENT: officerManagement.address,
    USER_AUTHENTICATION: userAuthentication.address,
    TENDER_MANAGEMENT: tenderManagement.address
  };
  
  // Save to deployed-contracts.json
  fs.writeFileSync(
    './src/config/deployed-contracts.json', 
    JSON.stringify(contractsConfig, null, 2)
  );
  console.log('Contract addresses saved to src/config/deployed-contracts.json');
  
  // Also update the contracts.ts file
  console.log('Updating contract addresses in src/config/contracts.ts...');
  updateContractsTs(contractsConfig);
}

function updateContractsTs(addresses) {
  try {
    const contractsPath = './src/config/contracts.ts';
    let contractsContent = fs.readFileSync(contractsPath, 'utf8');
    
    // Update the addresses
    contractsContent = contractsContent.replace(
      /OFFICER_MANAGEMENT: '.*'/,
      `OFFICER_MANAGEMENT: '${addresses.OFFICER_MANAGEMENT}'`
    );
    
    contractsContent = contractsContent.replace(
      /USER_AUTHENTICATION: '.*'/,
      `USER_AUTHENTICATION: '${addresses.USER_AUTHENTICATION}'`
    );
    
    contractsContent = contractsContent.replace(
      /TENDER_MANAGEMENT: '.*'/,
      `TENDER_MANAGEMENT: '${addresses.TENDER_MANAGEMENT}'`
    );
    
    fs.writeFileSync(contractsPath, contractsContent);
    console.log('Successfully updated src/config/contracts.ts');
  } catch (error) {
    console.error('Error updating contracts.ts:', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
