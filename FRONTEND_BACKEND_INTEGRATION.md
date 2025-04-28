# Frontend and Backend Integration

This document explains how the React/Vite frontend connects to the Ethereum smart contract backend (Hardhat), how MetaMask is integrated, and how role-based UI and CRUD operations are wired end-to-end.

---

## 1. Architecture Overview

- **Smart Contracts**: Written in Solidity, deployed locally via Hardhat scripts (`scripts/deploy.js`). ABI and contract address emitted to `/src/contracts/Tender.json`.
- **Backend (Local Node)**: `npx hardhat node` spins up a JSON-RPC endpoint at `http://127.0.0.1:8545` (chainId `31337`).
- **Frontend**: Vite-powered React app in `src/`:
  - **Contexts**: `AuthContext` (demo auth + roles), `Web3Context` (ethers.js provider, signer, contract).
  - **Pages/Components**: CRUD forms under `src/pages` and `src/components`, using React Router for routing.
  - **Tailwind CSS**: Utility-first styling via PostCSS and Tailwind, configured in `tailwind.config.js`.

## 2. Environment Configuration

1. Create a file `.env` at project root:
   ```env
   VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddressHere
   ```
2. Vite exposes variables prefixed with `VITE_`. In `Web3Context`, load with:
   ```ts
   const address = import.meta.env.VITE_CONTRACT_ADDRESS;
   ```

## 3. Web3 and MetaMask Integration

- **Web3Context** (`src/contexts/Web3Context.tsx`):
  - `connectWallet()`: prompts MetaMask, retrieves `provider`, `signer`, and stores `account`.
  - Instantiates `ethers.Contract(address, abi, signer)`.
  - Provides `account`, `isConnected`, and `contract` via React context.

- **Root Setup** (`src/main.tsx`):
  ```tsx
  createRoot(...).render(
    <Web3Provider>
      <App />
    </Web3Provider>
  );
  ```

- **NavBar Wallet UI**: `NavBar.tsx` shows "Connect Wallet" button when `!isConnected`, then displays `account` shorthand when connected.

## 4. Role-Based Access Control

- **AuthContext** (`src/contexts/AuthContext.tsx`): demo users with roles `admin`, `officer`, `bidder`.
- **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): wraps routes, redirects by `allowedRoles`.
- **NavBar Links**: Filters menu items by `authState.user.role`.

## 5. CRUD Workflows

### 5.1 Tender Creation (Tender Officers & Admin)

- **Page**: `src/pages/CreateTender.tsx`.
- **Form**: collects title, description, budget, deadline, and file upload.
- **IPFS Storage**: Upload document to IPFS (using e.g. `ipfs-http-client`), store returned CID in contract.
- **Smart Contract Call**:
  ```ts
  await contract.createTender(title, description, cid, budget, deadline);
  ```
- **UI Update**: After tx confirmed, refresh tenders list via `contract.getTenders()`.

### 5.2 Tender Listing & Details

- **Page**: `src/pages/Tenders.tsx`, fetches all tenders, filters by role:
  - **Admin/Officer**: view all.
  - **Bidder**: view only `status === 'open'`.

- **Details**: `src/pages/TenderDetails.tsx`, shows contract fields and attached IPFS docs (CID → `https://ipfs.io/ipfs/${cid}`).

### 5.3 Bid Submission (Bidders)

- **Page**: `src/pages/SubmitBid.tsx`.
- **Form**: enter amount and optional IPFS proposal.
- **Smart Contract Call**:
  ```ts
  await contract.placeBid(tenderId, amount, proposalCid);
  ```
- **UI**: On confirmation, navigate to `MyBids` and list bids by filtering `contract.getBids(tenderId)`.

### 5.4 Edit & Delete (Admin/Officer)

- **Edit Tender**: call `contract.updateTender(id, newParams)` (implement in Solidity + UI).
- **Close/Delete Tender**: call `contract.closeTender(id)` or `contract.cancelTender(id)`.
- **UI**: Show "Edit"/"Delete" buttons only to authorized roles.

## 6. Displaying Blockchain Transactions

- **Dashboard** (`src/components/blockchain/BlockchainVisualizer.tsx`): fetch latest blocks and events:
  ```ts
  const filter = contract.filters.TenderCreated();
  const events = await contract.queryFilter(filter);
  ```
- **Live Updates**: subscribe to `contract.on('TenderCreated', handler)` and update state.

## 7. Data Privacy & Filtering

- All UI queries filter data based on `authState.user` or `account`:
  - **Admin**: full access.
  - **Officer**: only tenders they created or manage.
  - **Bidder**: only their bids and open tenders.

## 8. Valid Contract Address & Deployment

1. Deploy contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
2. Copy the deployed address from console/log into `.env`.

## 9. Summary

This integration ensures:
- Secure Web3 connectivity and MetaMask wallet flow.
- Real on-chain transactions for tender and bid workflows.
- Role-based UI rendering and data filtering.
- IPFS-backed document storage.
- Live blockchain event visualization.

---

## 10. UI Data Display & CRUD Features

- **Admin**:
  - Create, edit, delete any tender.
  - Manage officer accounts (assign/revoke roles).
- **Tender Officer**:
  - Create new tenders; edit or close tenders they own.
- **Bidder**:
  - View only open tenders; submit, update, or cancel own bids.

### Role-Based Views
- Frontend filters data by `authState.user.role` and `account` (from `Web3Context`).
- `ProtectedRoute` enforces access at the route level.

### Contract Address & Deployment
- Configure a real contract address via `.env` (`VITE_CONTRACT_ADDRESS=0x...`).
- Deployed on localhost or testnet; `Web3Context` uses `import.meta.env.VITE_CONTRACT_ADDRESS`.

### MetaMask Integration
- Users connect wallet in NavBar (`connectWallet()`), storing `account` and `signer`.
- All transactions (e.g. `contract.createTender`, `contract.placeBid`) are signed in MetaMask.
- UI awaits confirmations and refreshes data (e.g. refetch lists).

### Real-Time Blockchain Updates
- Subscribe to contract events with `contract.on(eventName, handler)`.
- Update dashboard and tables live upon events like `TenderCreated`, `BidPlaced`.

---

