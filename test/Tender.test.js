const Tender = artifacts.require("Tender");
const { time } = require("@openzeppelin/test-helpers");

contract("Tender", accounts => {
  let tender;
  const creator = accounts[0];
  const bidder1 = accounts[1];
  const bidder2 = accounts[2];

  beforeEach(async () => {
    tender = await Tender.new({ from: creator });
  });

  describe("Creating a tender", () => {
    it("should create a new tender", async () => {
      const title = "Test Tender";
      const description = "Test Description";
      const budget = web3.utils.toWei("1", "ether");
      const deadline = (await time.latest()).add(time.duration.days(7));

      const result = await tender.createTender(
        title,
        description,
        budget,
        deadline,
        { from: creator }
      );

      assert.equal(result.logs[0].event, "TenderCreated");
      
      const tenderInfo = await tender.getTender(0);
      assert.equal(tenderInfo.title, title);
      assert.equal(tenderInfo.description, description);
      assert.equal(tenderInfo.budget.toString(), budget.toString());
      assert.equal(tenderInfo.creator, creator);
      assert.equal(tenderInfo.isActive, true);
    });
  });

  describe("Placing bids", () => {
    beforeEach(async () => {
      const deadline = (await time.latest()).add(time.duration.days(7));
      await tender.createTender(
        "Test Tender",
        "Test Description",
        web3.utils.toWei("1", "ether"),
        deadline,
        { from: creator }
      );
    });

    it("should allow placing a valid bid", async () => {
      const amount = web3.utils.toWei("0.5", "ether");
      const proposal = "Test Proposal";

      const result = await tender.placeBid(0, amount, proposal, { from: bidder1 });
      assert.equal(result.logs[0].event, "BidPlaced");
      
      const bid = await tender.getBid(0, 0);
      assert.equal(bid.bidder, bidder1);
      assert.equal(bid.amount.toString(), amount.toString());
      assert.equal(bid.proposal, proposal);
    });

    it("should not allow bid amount exceeding budget", async () => {
      const amount = web3.utils.toWei("2", "ether");
      const proposal = "Test Proposal";

      try {
        await tender.placeBid(0, amount, proposal, { from: bidder1 });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert(error.message.includes("Bid amount exceeds budget"));
      }
    });
  });

  describe("Awarding tender", () => {
    beforeEach(async () => {
      const deadline = (await time.latest()).add(time.duration.days(7));
      await tender.createTender(
        "Test Tender",
        "Test Description",
        web3.utils.toWei("1", "ether"),
        deadline,
        { from: creator }
      );
      await tender.placeBid(
        0,
        web3.utils.toWei("0.5", "ether"),
        "Proposal 1",
        { from: bidder1 }
      );
    });

    it("should allow creator to award tender", async () => {
      const result = await tender.awardTender(0, bidder1, { from: creator });
      assert.equal(result.logs[0].event, "TenderAwarded");
      
      const tenderInfo = await tender.getTender(0);
      assert.equal(tenderInfo.winner, bidder1);
      assert.equal(tenderInfo.isActive, false);
    });

    it("should not allow non-creator to award tender", async () => {
      try {
        await tender.awardTender(0, bidder1, { from: bidder2 });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert(error.message.includes("Only tender creator can perform this action"));
      }
    });
  });
}); 