require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    compilers: [
      { 
        version: "0.8.20",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  paths: {
    sources: "./src/contracts",
    artifacts: "./src/artifacts",
    cache: "./cache"
  }
};
