// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Tender {
    struct TenderInfo {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        bool isActive;
        address winner;
        bool completed;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        string proposal;
    }

    mapping(uint256 => TenderInfo) public tenders;
    mapping(uint256 => Bid[]) public bids;
    uint256 public tenderCount;

    event TenderCreated(uint256 indexed tenderId, address indexed creator, string title, uint256 budget);
    event BidPlaced(uint256 indexed tenderId, address indexed bidder, uint256 amount);
    event TenderAwarded(uint256 indexed tenderId, address indexed winner);
    event TenderCompleted(uint256 indexed tenderId);

    modifier onlyTenderCreator(uint256 _tenderId) {
        require(msg.sender == tenders[_tenderId].creator, "Only tender creator can perform this action");
        _;
    }

    modifier tenderExists(uint256 _tenderId) {
        require(_tenderId < tenderCount, "Tender does not exist");
        _;
    }

    modifier tenderActive(uint256 _tenderId) {
        require(tenders[_tenderId].isActive, "Tender is not active");
        require(block.timestamp < tenders[_tenderId].deadline, "Tender deadline has passed");
        _;
    }

    function createTender(
        string memory _title,
        string memory _description,
        uint256 _budget,
        uint256 _deadline
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        uint256 tenderId = tenderCount++;
        TenderInfo storage tender = tenders[tenderId];
        
        tender.id = tenderId;
        tender.creator = msg.sender;
        tender.title = _title;
        tender.description = _description;
        tender.budget = _budget;
        tender.deadline = _deadline;
        tender.isActive = true;
        tender.completed = false;

        emit TenderCreated(tenderId, msg.sender, _title, _budget);
        return tenderId;
    }

    function placeBid(
        uint256 _tenderId,
        uint256 _amount,
        string memory _proposal
    ) public tenderExists(_tenderId) tenderActive(_tenderId) {
        require(_amount <= tenders[_tenderId].budget, "Bid amount exceeds budget");
        require(msg.sender != tenders[_tenderId].creator, "Creator cannot bid on their own tender");

        bids[_tenderId].push(Bid({
            bidder: msg.sender,
            amount: _amount,
            proposal: _proposal
        }));

        emit BidPlaced(_tenderId, msg.sender, _amount);
    }

    function awardTender(uint256 _tenderId, address _winner) 
        public 
        tenderExists(_tenderId) 
        onlyTenderCreator(_tenderId) 
    {
        require(tenders[_tenderId].isActive, "Tender is not active");
        require(!tenders[_tenderId].completed, "Tender is already completed");
        
        tenders[_tenderId].isActive = false;
        tenders[_tenderId].winner = _winner;
        
        emit TenderAwarded(_tenderId, _winner);
    }

    function completeTender(uint256 _tenderId) 
        public 
        tenderExists(_tenderId) 
        onlyTenderCreator(_tenderId) 
    {
        require(!tenders[_tenderId].isActive, "Tender must be awarded first");
        require(!tenders[_tenderId].completed, "Tender is already completed");
        
        tenders[_tenderId].completed = true;
        
        emit TenderCompleted(_tenderId);
    }

    function getTender(uint256 _tenderId) 
        public 
        view 
        tenderExists(_tenderId) 
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory description,
            uint256 budget,
            uint256 deadline,
            bool isActive,
            address winner,
            bool completed
        ) 
    {
        TenderInfo storage tender = tenders[_tenderId];
        return (
            tender.id,
            tender.creator,
            tender.title,
            tender.description,
            tender.budget,
            tender.deadline,
            tender.isActive,
            tender.winner,
            tender.completed
        );
    }

    function getBidsCount(uint256 _tenderId) public view tenderExists(_tenderId) returns (uint256) {
        return bids[_tenderId].length;
    }

    function getBid(uint256 _tenderId, uint256 _bidIndex) 
        public 
        view 
        tenderExists(_tenderId) 
        returns (
            address bidder,
            uint256 amount,
            string memory proposal
        ) 
    {
        require(_bidIndex < bids[_tenderId].length, "Bid index out of bounds");
        Bid storage bid = bids[_tenderId][_bidIndex];
        return (bid.bidder, bid.amount, bid.proposal);
    }
} 