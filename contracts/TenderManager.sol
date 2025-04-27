// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TenderManager
 * @dev A smart contract for managing tenders and bids with a clean, modular structure
 */
contract TenderManager {
    // Enums
    enum TenderStatus {
        ACTIVE,
        CLOSED,
        CANCELLED
    }

    // Structs
    struct Tender {
        uint256 id;
        string title;
        string description;
        uint256 deadline;
        uint256 minBid;
        address ownerAddress;
        TenderStatus status;
        uint256 winningBidId;
        uint256 createdAt;
        bytes32 documentHash;  // IPFS hash of tender documents
        bool isPrivate;       // Whether this is a private tender
        address[] allowedBidders;  // List of addresses allowed to bid (for private tenders)
    }

    struct Bid {
        uint256 id;
        uint256 tenderId;
        address bidderAddress;
        uint256 bidAmount;
        uint256 timestamp;
        string proposal;
    }

    // State Variables
    uint256 private tenderCount;
    uint256 private bidCount;
    
    // Mappings
    mapping(uint256 => Tender) private tenders;
    mapping(uint256 => Bid[]) private tenderBids;
    mapping(uint256 => uint256) private tenderBidCount;
    mapping(address => bool) private verifiedVendors;  // For tracking verified vendors
    mapping(uint256 => mapping(address => bool)) private hasBid;  // Track if address has bid on tender

    // Events
    event TenderCreated(
        uint256 indexed tenderId,
        address indexed owner,
        string title,
        uint256 deadline,
        bool isPrivate,
        bytes32 documentHash
    );
    
    event BidSubmitted(
        uint256 indexed tenderId,
        uint256 indexed bidId,
        address indexed bidder,
        uint256 amount,
        string proposal
    );
    
    event TenderClosed(
        uint256 indexed tenderId,
        uint256 indexed winningBidId,
        address indexed winner,
        uint256 winningAmount
    );
    
    event TenderCancelled(
        uint256 indexed tenderId,
        address indexed owner
    );

    event VendorVerified(
        address indexed vendor,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyTenderOwner(uint256 _tenderId) {
        require(
            msg.sender == tenders[_tenderId].ownerAddress,
            "Only tender owner can perform this action"
        );
        _;
    }

    modifier tenderExists(uint256 _tenderId) {
        require(_tenderId < tenderCount, "Tender does not exist");
        _;
    }

    modifier tenderActive(uint256 _tenderId) {
        require(
            tenders[_tenderId].status == TenderStatus.ACTIVE,
            "Tender is not active"
        );
        require(
            block.timestamp < tenders[_tenderId].deadline,
            "Tender deadline has passed"
        );
        _;
    }

    modifier validBidAmount(uint256 _tenderId, uint256 _amount) {
        require(
            _amount >= tenders[_tenderId].minBid,
            "Bid amount is below minimum"
        );
        _;
    }

    modifier onlyVerifiedVendor() {
        require(verifiedVendors[msg.sender], "Only verified vendors can perform this action");
        _;
    }

    // Constructor
    constructor() {
        tenderCount = 0;
        bidCount = 0;
    }

    // External Functions
    function createTender(
        string memory _title,
        string memory _description,
        uint256 _deadline,
        uint256 _minBid,
        bytes32 _documentHash,
        bool _isPrivate,
        address[] memory _allowedBidders
    ) external returns (uint256) {
        // Input validation
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_deadline - block.timestamp >= 1 days, "Minimum tender duration is 1 day");
        require(_deadline - block.timestamp <= 90 days, "Maximum tender duration is 90 days");
        require(_minBid > 0, "Minimum bid must be greater than 0");
        
        // Additional validation for private tenders
        if (_isPrivate) {
            require(_allowedBidders.length > 0, "Private tender must have allowed bidders");
            require(_allowedBidders.length <= 20, "Too many allowed bidders");
        }

        uint256 tenderId = tenderCount++;
        
        tenders[tenderId] = Tender({
            id: tenderId,
            title: _title,
            description: _description,
            deadline: _deadline,
            minBid: _minBid,
            ownerAddress: msg.sender,
            status: TenderStatus.ACTIVE,
            winningBidId: 0,
            createdAt: block.timestamp,
            documentHash: _documentHash,
            isPrivate: _isPrivate,
            allowedBidders: _isPrivate ? _allowedBidders : new address[](0)
        });

        emit TenderCreated(
            tenderId,
            msg.sender,
            _title,
            _deadline,
            _isPrivate,
            _documentHash
        );

        return tenderId;
    }

    function submitBid(
        uint256 _tenderId,
        uint256 _amount,
        string memory _proposal
    ) external tenderExists(_tenderId) tenderActive(_tenderId) validBidAmount(_tenderId, _amount) {
        require(
            msg.sender != tenders[_tenderId].ownerAddress,
            "Owner cannot bid on own tender"
        );
        require(
            !hasBid[_tenderId][msg.sender],
            "Address has already bid on this tender"
        );
        require(
            !tenders[_tenderId].isPrivate || 
            isAddressInArray(msg.sender, tenders[_tenderId].allowedBidders),
            "Address not allowed to bid on private tender"
        );

        uint256 bidId = bidCount++;
        uint256 bidIndex = tenderBidCount[_tenderId]++;
        
        tenderBids[_tenderId].push(Bid({
            id: bidId,
            tenderId: _tenderId,
            bidderAddress: msg.sender,
            bidAmount: _amount,
            timestamp: block.timestamp,
            proposal: _proposal
        }));

        // Mark that this address has bid on this tender
        hasBid[_tenderId][msg.sender] = true;

        emit BidSubmitted(_tenderId, bidId, msg.sender, _amount, _proposal);
    }

    // Helper function to check if address is in array
    function isAddressInArray(address _addr, address[] memory _array) private pure returns (bool) {
        for (uint i = 0; i < _array.length; i++) {
            if (_array[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function closeTender(
        uint256 _tenderId
    ) external tenderExists(_tenderId) onlyTenderOwner(_tenderId) {
        require(
            tenders[_tenderId].status == TenderStatus.ACTIVE,
            "Tender is not active"
        );
        require(
            tenderBidCount[_tenderId] > 0,
            "No bids to select winner from"
        );

        // Find lowest bid
        uint256 lowestBidIndex = 0;
        uint256 lowestBidAmount = tenderBids[_tenderId][0].bidAmount;
        
        for (uint256 i = 1; i < tenderBidCount[_tenderId]; i++) {
            if (tenderBids[_tenderId][i].bidAmount < lowestBidAmount) {
                lowestBidAmount = tenderBids[_tenderId][i].bidAmount;
                lowestBidIndex = i;
            }
        }

        // Update tender status and winning bid
        tenders[_tenderId].status = TenderStatus.CLOSED;
        tenders[_tenderId].winningBidId = lowestBidIndex;

        emit TenderClosed(
            _tenderId,
            lowestBidIndex,
            tenderBids[_tenderId][lowestBidIndex].bidderAddress,
            lowestBidAmount
        );
    }

    function cancelTender(
        uint256 _tenderId
    ) external tenderExists(_tenderId) onlyTenderOwner(_tenderId) {
        require(
            tenders[_tenderId].status == TenderStatus.ACTIVE,
            "Tender is not active"
        );

        tenders[_tenderId].status = TenderStatus.CANCELLED;
        emit TenderCancelled(_tenderId, msg.sender);
    }

    // View Functions
    function getTender(
        uint256 _tenderId
    ) external view tenderExists(_tenderId) returns (
        string memory title,
        string memory description,
        uint256 deadline,
        uint256 minBid,
        address ownerAddress,
        TenderStatus status,
        uint256 winningBidId,
        uint256 createdAt,
        bytes32 documentHash,
        bool isPrivate,
        uint256 totalBids
    ) {
        Tender storage tender = tenders[_tenderId];
        return (
            tender.title,
            tender.description,
            tender.deadline,
            tender.minBid,
            tender.ownerAddress,
            tender.status,
            tender.winningBidId,
            tender.createdAt,
            tender.documentHash,
            tender.isPrivate,
            tenderBidCount[_tenderId]
        );
    }

    function getAllTenders(
        uint256 _offset,
        uint256 _limit
    ) external view returns (
        uint256[] memory ids,
        string[] memory titles,
        address[] memory owners,
        TenderStatus[] memory statuses,
        uint256[] memory deadlines,
        uint256[] memory minBids,
        uint256[] memory totalBids
    ) {
        uint256 count = _limit;
        if (_offset + _limit > tenderCount) {
            count = tenderCount - _offset;
        }
        
        ids = new uint256[](count);
        titles = new string[](count);
        owners = new address[](count);
        statuses = new TenderStatus[](count);
        deadlines = new uint256[](count);
        minBids = new uint256[](count);
        totalBids = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 tenderId = _offset + i;
            Tender storage tender = tenders[tenderId];
            
            ids[i] = tender.id;
            titles[i] = tender.title;
            owners[i] = tender.ownerAddress;
            statuses[i] = tender.status;
            deadlines[i] = tender.deadline;
            minBids[i] = tender.minBid;
            totalBids[i] = tenderBidCount[tenderId];
        }
        
        return (ids, titles, owners, statuses, deadlines, minBids, totalBids);
    }

    function getTenderBids(
        uint256 _tenderId,
        uint256 _offset,
        uint256 _limit
    ) external view tenderExists(_tenderId) returns (
        uint256[] memory ids,
        address[] memory bidders,
        uint256[] memory amounts,
        uint256[] memory timestamps,
        string[] memory proposals
    ) {
        uint256 totalBids = tenderBidCount[_tenderId];
        uint256 count = _limit;
        if (_offset + _limit > totalBids) {
            count = totalBids - _offset;
        }
        
        ids = new uint256[](count);
        bidders = new address[](count);
        amounts = new uint256[](count);
        timestamps = new uint256[](count);
        proposals = new string[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 bidIndex = _offset + i;
            Bid storage bid = tenderBids[_tenderId][bidIndex];
            
            ids[i] = bid.id;
            bidders[i] = bid.bidderAddress;
            amounts[i] = bid.bidAmount;
            timestamps[i] = bid.timestamp;
            proposals[i] = bid.proposal;
        }
        
        return (ids, bidders, amounts, timestamps, proposals);
    }

    function getTenderCount() external view returns (uint256) {
        return tenderCount;
    }

    function getTenderBidsCount(
        uint256 _tenderId
    ) external view tenderExists(_tenderId) returns (uint256) {
        return tenderBidCount[_tenderId];
    }
} 