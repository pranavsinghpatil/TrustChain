export const TARGET_NETWORK = {
  chainId: 31337, // Local Hardhat Network
  name: "Laitlum Network",
  rpcUrl: "http://127.0.0.1:8545", // Local Ganache RPC URL
  nativeCurrency: {
    name: "LTM",
    symbol: "LTM",
    decimals: 18
  },
  blockExplorerUrls: [] // No block explorer for local development
};
