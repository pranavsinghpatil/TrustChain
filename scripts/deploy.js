const hre = require("hardhat");

async function main() {
  const Tender = await hre.ethers.getContractFactory("Tender");
  const tender = await Tender.deploy();

  await tender.deployed();

  console.log("Tender contract deployed to:", tender.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 