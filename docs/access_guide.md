# Tender DApp Access Guide

## Running the Project

### 1. Backend (Smart Contracts)
Start the Hardhat node:
```bash
npx hardhat node
```

### 2. Frontend
In a new terminal window, start the Vite development server:
```bash
npm run dev
```

### 3. Deploy Contracts
After starting the Hardhat node, deploy the contracts:
```bash
npx hardhat run scripts/deploy.cjs --network hardhat
```

## Accessing from Other Devices

### 1. Frontend Access
Access the frontend from other devices using:
```
http://192.168.1.6:3000
```

### 2. MetaMask Configuration
Configure MetaMask on other devices with these settings:
- Network Name: Hardhat Network
- RPC URL: `http://192.168.1.6:8545`
- Chain ID: 31337
- Currency Symbol: ETH
- Block Explorer URL: (leave blank)

### 3. Contract Addresses
The deployed contract addresses are:
- AdminManagement: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- OfficerManagement: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
- UserAuthentication: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
- TenderManagement: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

## Troubleshooting

### Common Issues
1. **Connection Refused**
   - Ensure both Hardhat node and Vite server are running
   - Check if ports 8545 and 3000 are not blocked by firewall

2. **MetaMask Connection**
   - Verify RPC URL is correct
   - Ensure MetaMask is unlocked
   - Check if network is properly added

3. **Frontend Not Loading**
   - Clear browser cache
   - Try accessing with IP address directly
   - Check if Vite server is running

## Security Note
This setup is for development purposes only. For production use:
1. Use a proper blockchain network (like Ethereum testnet)
2. Secure your private keys
3. Use proper SSL certificates for frontend
4. Consider deploying smart contracts to a public network
