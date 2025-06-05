/** @type import('hardhat/config').HardhatUserConfig */
import "@nomiclabs/hardhat-ethers";
import "ts-node/register";

export default {
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
  paths: {
    sources: "src/contracts",
    artifacts: "artifacts",
    tests: "./test",
    cache: "./cache"
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 0
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  }
};