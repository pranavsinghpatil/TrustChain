# MetaMask Setup Guide for Laitlum Network

## 1. Add Laitlum Network to MetaMask

1. Open MetaMask extension in your browser
2. Click on the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network"
4. Fill in the following details:
   - Network Name: Laitlum Network
   - New RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: LTM
   - Block Explorer URL: Leave empty
5. Click "Save"

## 2. Import Test Account

1. Click on your current account in MetaMask
2. Click "Import Account"
3. Choose "Private Key" import
4. You have two options:
   
   ### Option 1: Use Pre-defined Account
   - Paste one of these private keys:
     ```
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
     0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
     ```
   
   ### Option 2: Use Mnemonic Phrase
   - Paste this mnemonic phrase:
     ```
     test test test test test test test test test test test junk
     ```
   - MetaMask will generate multiple accounts from this phrase
   - Switch between accounts using the account dropdown

## 3. Verify Connection

1. Ensure your local blockchain node is running (`npx hardhat node`)
2. Check MetaMask shows:
   - Network: Laitlum Network
   - Currency: LTM
   - Balance: 10,000 LTM (for pre-defined accounts)

## 4. Troubleshooting

- If MetaMask doesn't connect:
  - Ensure your local node is running
  - Check if port 8545 is accessible
  - Restart MetaMask
  - Try adding the network again

- If you don't see LTM balance:
  - Make sure you're on the Laitlum Network
  - Try refreshing MetaMask
  - Check if you imported the correct private key/mnemonic

## 5. Using the Application

1. Open your application in the browser
2. Click the "Connect Wallet" button
3. Select MetaMask from the options
4. Approve the connection in MetaMask
5. You should now be able to:
   - Interact with smart contracts
   - Send LTM transactions
   - View your balance
   - Make function calls to the contracts

## Important Notes

- This is a local test network - funds are not real
- Transactions are instant and free
- You can create multiple accounts for testing
- Always keep your private keys and mnemonic phrases secure
- Never use these test accounts for real transactions
