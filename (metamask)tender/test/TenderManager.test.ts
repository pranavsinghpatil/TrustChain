import { expect } from "chai";
import { ethers } from "hardhat";
import { TenderManager } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("TenderManager", function () {
  let tenderManager: TenderManager;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;

  beforeEach(async function () {
    [owner, admin, bidder1, bidder2] = await ethers.getSigners();
    const TenderManager = await ethers.getContractFactory("TenderManager");
    tenderManager = await TenderManager.deploy();
    await tenderManager.deployed();

    // Set up admin
    await tenderManager.addAdmin(admin.address);
  });

  describe("Tender Closing and Winner Selection", function () {
    let tenderId: number;
    let bidId1: number;
    let bidId2: number;

    beforeEach(async function () {
      // Create a tender
      const tx = await tenderManager.createTender(
        "Test Tender",
        "Test Description",
        Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        ethers.utils.parseEther("1.0"),
        ethers.utils.formatBytes32String("test-hash"),
        false,
        []
      );
      const receipt = await tx.wait();
      tenderId = receipt.events![0].args!.tenderId.toNumber();

      // Submit bids
      await tenderManager.connect(bidder1).submitBid(
        tenderId,
        ethers.utils.parseEther("2.0"),
        "Bid 1 Proposal"
      );
      await tenderManager.connect(bidder2).submitBid(
        tenderId,
        ethers.utils.parseEther("3.0"),
        "Bid 2 Proposal"
      );

      // Get bid IDs
      const bids = await tenderManager.getTenderBids(tenderId, 0, 2);
      bidId1 = bids.ids[0].toNumber();
      bidId2 = bids.ids[1].toNumber();
    });

    it("should allow tender owner to close tender and select winner", async function () {
      // Close tender and select winner
      await tenderManager.closeTender(tenderId, bidId2);

      // Verify tender status
      const tender = await tenderManager.getTender(tenderId);
      expect(tender.status).to.equal(1); // CLOSED

      // Verify bid statuses
      expect(await tenderManager.getBidStatus(tenderId, bidId1)).to.equal(2); // NotSelected
      expect(await tenderManager.getBidStatus(tenderId, bidId2)).to.equal(1); // Winner
    });

    it("should not allow non-owner to close tender", async function () {
      await expect(
        tenderManager.connect(bidder1).closeTender(tenderId, bidId1)
      ).to.be.revertedWith("Only tender owner can close tender");
    });

    it("should not allow closing tender with invalid bid ID", async function () {
      await expect(
        tenderManager.closeTender(tenderId, 999)
      ).to.be.revertedWith("Invalid winning bid");
    });

    it("should emit correct events when closing tender", async function () {
      const tx = await tenderManager.closeTender(tenderId, bidId2);
      const receipt = await tx.wait();

      // Check TenderClosed event
      expect(receipt.events![0].event).to.equal("TenderClosed");
      expect(receipt.events![0].args!.tenderId).to.equal(tenderId);
      expect(receipt.events![0].args!.winningBidId).to.equal(bidId2);
      expect(receipt.events![0].args!.winner).to.equal(bidder2.address);

      // Check BidStatusUpdated events
      expect(receipt.events![1].event).to.equal("BidStatusUpdated");
      expect(receipt.events![1].args!.tenderId).to.equal(tenderId);
      expect(receipt.events![1].args!.bidId).to.equal(bidId1);
      expect(receipt.events![1].args!.status).to.equal(2);

      expect(receipt.events![2].event).to.equal("BidStatusUpdated");
      expect(receipt.events![2].args!.tenderId).to.equal(tenderId);
      expect(receipt.events![2].args!.bidId).to.equal(bidId2);
      expect(receipt.events![2].args!.status).to.equal(1);
    });

    it("should not allow closing already closed tender", async function () {
      await tenderManager.closeTender(tenderId, bidId2);
      await expect(
        tenderManager.closeTender(tenderId, bidId1)
      ).to.be.revertedWith("Tender is not active");
    });
  });
}); 