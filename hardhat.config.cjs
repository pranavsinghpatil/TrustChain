require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config();

// Get environment variables or use defaults
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_API_KEY = process.env.SEPOLIA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 1000
      },
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10
      },
      initialBaseFeePerGas: 0,
      allowUnlimitedContractSize: true,
      chain: {
        name: "Laitlum Network",
        shortName: "ltm",
        networkId: 31337,
        chainId: 31337,
        currency: {
          name: "Laitlum",
          symbol: "LTM",
          decimals: 18
        }
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
      ]
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${SEPOLIA_API_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111,
      gas: 2100000,
      gasPrice: 8000000000
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  }
};