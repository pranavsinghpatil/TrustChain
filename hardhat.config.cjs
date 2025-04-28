require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@typechain/hardhat");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  },
}; 