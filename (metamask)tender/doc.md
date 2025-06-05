# Tender Management System Documentation

## Project Overview
A decentralized tender management system built on Ethereum blockchain, featuring three distinct user roles: Admin, Tender Officers, and Bidders. The system ensures transparency and security through blockchain integration and smart contracts.

## Technology Stack

### Frontend
- Next.js 14.2.28
- React
- TypeScript
- Material-UI (MUI)
- Web3.js/Ethers.js for blockchain integration
- MetaMask wallet integration

### Backend
- Hardhat (Ethereum development environment)
- Smart contracts (Ethereum)
- IPFS for document storage
- Local blockchain node for development

### Blockchain
- Ethereum network
- Smart contracts for tender management
- MetaMask wallet integration
- Web3 integration

## System Architecture

### User Roles

1. **Admin**
   - Supervises and manages tender officers
   - System-wide oversight
   - User management
   - Activity monitoring

2. **Tender Officers**
   - Create and manage tenders
   - Review and award bids
   - Document management
   - Tender lifecycle management

3. **Users (Bidders)**
   - Browse available tenders
   - Submit bids
   - Track bid status
   - View tender details

## Key Features

### User (Bidder) Flow
- **Dashboard**
  - Active bids overview
  - Won contracts
  - Success rate statistics
  - Total value of bids
  - Recent tender activity

- **Tender Browsing**
  - Search and filter tenders
  - View tender details
  - Document access
  - Blockchain transparency

- **Bid Management**
  - Submit bids
  - Track bid status
  - View bid history
  - Win probability indicators

### Tender Officer Flow
- **Tender Creation**
  - Create new tenders
  - Set specifications
  - Upload documents
  - Define selection criteria

- **Tender Management**
  - Edit tender details
  - Close tenders
  - Award winners
  - Document management

- **Bid Review**
  - View all bids
  - Evaluate bidder details
  - Select winners
  - Manage bid status

### Admin Flow
- **User Management**
  - Add/remove users
  - Assign roles
  - Manage permissions
  - User activity monitoring

- **System Oversight**
  - View all tenders
  - Assign tender officers
  - Monitor system activity
  - Generate reports

- **Activity Log**
  - Track all system actions
  - Monitor transactions
  - Audit trail
  - Security monitoring

## Blockchain Integration

### Smart Contract Functions
1. **Tender Management**
   ```solidity
   function createTender(
       string memory _title,
       string memory _description,
       uint256 _budget,
       uint256 _deadline
   ) public returns (uint256)
   ```

2. **Bid Management**
   ```solidity
   function placeBid(
       uint256 _tenderId,
       uint256 _amount,
       string memory _proposal
   ) public
   ```

3. **Tender Awarding**
   ```solidity
   function awardTender(uint256 _tenderId, address _winner) public
   ```

4. **Tender Completion**
   ```solidity
   function completeTender(uint256 _tenderId) public
   ```

### MetaMask Integration
- Wallet connection
- Transaction signing
- Account management
- Network configuration

## Security Features

1. **Blockchain Security**
   - Smart contract verification
   - Transaction transparency
   - Immutable records
   - Decentralized storage

2. **Access Control**
   - Role-based permissions
   - Authentication
   - Authorization
   - Session management

3. **Data Security**
   - IPFS document storage
   - Encrypted communications
   - Secure file handling
   - Data integrity checks

## Development Setup

### Prerequisites
- Node.js v14+
- MetaMask browser extension
- Hardhat
- Ganache (local blockchain)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure MetaMask:
   - Network Name: Hardhat
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

4. Start the development servers:
   ```bash
   # Start Hardhat node (backend)
   npx hardhat node
   
   # In a new terminal, deploy contracts
   npx hardhat run scripts/deploy.js --network localhost
   
   # Start frontend
   npm run dev
   ```

## Project Structure

```
tender-main/
├── src/
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── tenders/
│   │   ├── my-bids.tsx
│   │   ├── my-tenders.tsx
│   │   ├── user-management.tsx
│   │   └── activity-log.tsx
│   ├── components/
│   └── utils/
├── contracts/
│   ├── Tender.sol
│   └── migrations/
├── scripts/
│   └── deploy.js
├── hardhat.config.js
├── static/
└── package.json
```

## Future Enhancements

1. **Advanced Features**
   - Real-time notifications
   - Advanced analytics
   - Automated bid evaluation
   - Multi-chain support

2. **UI/UX Improvements**
   - Mobile responsiveness
   - Dark mode
   - Enhanced data visualization
   - Improved user onboarding

3. **Security Enhancements**
   - Multi-factor authentication
   - Advanced encryption
   - Audit logging
   - Compliance features

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 