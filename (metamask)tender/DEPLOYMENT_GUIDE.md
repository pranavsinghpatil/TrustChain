# Smart Contract Deployment Guide

This guide will walk you through the process of deploying the TrustChain smart contracts to the Ethereum Sepolia testnet and integrating them with your application.

## Prerequisites

1. **MetaMask Wallet**: Install the [MetaMask browser extension](https://metamask.io/download.html) and create an account
2. **Sepolia ETH**: Obtain some Sepolia testnet ETH from a faucet:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
3. **Alchemy/Infura API Key**: Create a free account on [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/) to get an API key for Sepolia

## Setup Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Add your private key (without 0x prefix) and API key:

```
# Ethereum wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Alchemy or Infura API key for Sepolia testnet
SEPOLIA_API_KEY=your_api_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

> ⚠️ **Security Warning**: Never commit your `.env` file to version control. It's already in `.gitignore` for your protection.

## Deployment Steps

### 1. Compile the Smart Contracts

```bash
npx hardhat compile
```

### 2. Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will:
- Deploy all three contracts (UserAuthentication, OfficerManagement, TenderManagement)
- Output the contract addresses to the console
- Save the addresses to `src/contracts/addresses.json`

### 3. Update Contract Addresses in Frontend

```bash
node scripts/update-addresses.js
```

This script will automatically update the contract addresses in your frontend code.

### 4. Verify Contracts on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

Replace `<CONTRACT_ADDRESS>` with the address of each deployed contract.

## Wallet Connection Flow for Officers

The application now supports a blockchain-based officer management system. Here's how it works:

### For Administrators

1. **Connect Wallet**: Admin must connect their MetaMask wallet first
2. **Create Officers**: When creating an officer, their details are stored on the blockchain
3. **Manage Officers**: All officer management operations (update, remove) are recorded on-chain

### For Officers

1. **Login**: Officers can log in using their username/password credentials
2. **Connect Wallet**: After logging in, officers should connect their MetaMask wallet
3. **Blockchain Operations**: Once connected, officers can perform blockchain operations

## Troubleshooting

### MetaMask Connection Issues

- Ensure you're on the Sepolia testnet in MetaMask
- If you get a "Wrong Network" error, the app will prompt you to switch to Sepolia

### Contract Deployment Failures

- Ensure you have enough Sepolia ETH for gas fees
- Check that your private key and API key are correct in the `.env` file

### Transaction Errors

- Check the console for detailed error messages
- Ensure gas price settings are appropriate for the current network conditions

## Additional Resources

- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.io/v5/)
- [MetaMask Documentation](https://docs.metamask.io/)

## Next Steps

After successful deployment, your application will be fully blockchain-integrated. The localStorage-based officer management will be replaced with blockchain-based management, providing a secure and transparent system.
