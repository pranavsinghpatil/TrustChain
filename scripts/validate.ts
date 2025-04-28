import { ethers } from "hardhat";
import { TenderManager } from "../typechain-types";
import axios from "axios";

interface Web3StatusResponse {
  connected: boolean;
  chainId?: number;
  networkName?: string;
  error?: string;
}

async function validateContract() {
  console.log("Validating smart contract...");
  
  try {
    const [owner, bidder1, bidder2] = await ethers.getSigners();
    console.log("Using test accounts:", {
      owner: owner.address,
      bidder1: bidder1.address,
      bidder2: bidder2.address,
    });

    // Deploy contract
    const TenderManager = await ethers.getContractFactory("TenderManager");
    const tenderManager = await TenderManager.deploy();
    await tenderManager.deployed();
    console.log("Contract deployed at:", tenderManager.address);

    // Create a tender with 2 days duration
    const twoDaysFromNow = Math.floor(Date.now() / 1000) + (2 * 86400); // 2 days from now
    const createTx = await tenderManager.createTender(
      "Test Tender",
      "Test Description",
      twoDaysFromNow,
      ethers.utils.parseEther("1.0"),
      ethers.utils.formatBytes32String("test-hash"),
      false,
      []
    );
    await createTx.wait();
    console.log("✓ Created test tender");

    // Submit bids
    const bid1Tx = await tenderManager.connect(bidder1).submitBid(
      0,
      ethers.utils.parseEther("1.5"),
      "Bid 1 Proposal"
    );
    await bid1Tx.wait();
    console.log("✓ Submitted bid 1");

    const bid2Tx = await tenderManager.connect(bidder2).submitBid(
      0,
      ethers.utils.parseEther("2.0"),
      "Bid 2 Proposal"
    );
    await bid2Tx.wait();
    console.log("✓ Submitted bid 2");

    // Close tender with bid 2 as winner (higher bid)
    const closeTx = await tenderManager.closeTender(0, 1); // tenderId = 0, winningBidId = 1 (second bid)
    await closeTx.wait();
    console.log("✓ Closed tender");

    // Verify tender status
    const tender = await tenderManager.getTender(0);
    console.assert(tender.status === 1, "Tender should be closed");
    console.log("✓ Verified tender status");

    console.log("Smart contract validation completed successfully!");
    return true;
  } catch (error) {
    console.error("Contract validation failed:", error);
    return false;
  }
}

// Helper function to wait for a condition
async function waitFor(condition: () => Promise<boolean>, timeout: number = 60000, interval: number = 1000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

async function validateFrontend() {
  console.log("Validating frontend...");
  
  try {
    // Wait for frontend to be ready
    console.log("Waiting for frontend server to start...");
    const frontendReady = await waitFor(async () => {
      try {
        await axios.get("http://localhost:3000");
        return true;
      } catch {
        return false;
      }
    });

    if (!frontendReady) {
      throw new Error("Frontend server did not start within timeout");
    }
    console.log("✓ Frontend is running");

    // Check if Web3 connection is available
    console.log("Checking Web3 connection...");
    const web3Ready = await waitFor(async () => {
      try {
        const web3Response = await axios.get<Web3StatusResponse>("http://localhost:3000/api/web3-status");
        return web3Response.data.connected;
      } catch {
        return false;
      }
    });

    if (!web3Ready) {
      throw new Error("Web3 connection not available within timeout");
    }
    console.log("✓ Web3 connection is available");

    console.log("Frontend validation completed successfully!");
    return true;
  } catch (error) {
    console.error("Frontend validation failed:", error);
    return false;
  }
}

async function main() {
  const contractValid = await validateContract();
  const frontendValid = await validateFrontend();

  if (contractValid && frontendValid) {
    console.log("✅ All validations passed!");
    process.exit(0);
  } else {
    console.error("❌ Validation failed!");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 