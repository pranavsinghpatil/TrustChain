# Tender Smart Contract System

A decentralized tender management system built on Ethereum blockchain.

## Features

- Create tenders with title, description, budget, and deadline
- Place bids on active tenders
- Award tenders to winning bidders
- Complete awarded tenders
- View tender and bid details

## Prerequisites

- Node.js v14+ and npm
- Ganache (for local blockchain)
- Truffle Framework
- MetaMask browser extension

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Ganache and create a workspace
4. Configure MetaMask to connect to Ganache:
   - Network Name: Ganache
   - RPC URL: http://127.0.0.1:7545
   - Chain ID: 1337
   - Currency Symbol: ETH

5. Copy your `.env.example` to `.env` and update the values:
   ```
   INFURA_API_KEY=your_infura_api_key
   IPFS_API_KEY=your_ipfs_api_key
   IPFS_API_SECRET=your_ipfs_api_secret
   ```

6. Compile and deploy contracts:
   ```bash
   truffle compile
   truffle migrate
   ```

## Smart Contract Functions

### Creating a Tender
```solidity
function createTender(
    string memory _title,
    string memory _description,
    uint256 _budget,
    uint256 _deadline
) public returns (uint256)
```

### Placing a Bid
```solidity
function placeBid(
    uint256 _tenderId,
    uint256 _amount,
    string memory _proposal
) public
```

### Awarding a Tender
```solidity
function awardTender(uint256 _tenderId, address _winner) public
```

### Completing a Tender
```solidity
function completeTender(uint256 _tenderId) public
```

## Testing

Run the test suite:
```bash
truffle test
```

## License

MIT 