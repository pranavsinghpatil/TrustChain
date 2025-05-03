// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TenderManagement
 * @dev Contract for managing tenders in the TrustChain system
 */
contract TenderManagement {
    address public admin;
    
    struct Tender {
        string id;
        string title;
        string description;
        uint256 estimatedValue;
        uint256 startDate;
        uint256 endDate;
        address createdBy; // Officer who created the tender
        TenderStatus status;
        uint256 createdAt;
        string category;
        string department;
        string location;
        string[] documents; // IPFS hashes of tender documents
    }
    
    struct Bid {
        string id;
        string tenderId;
        address bidder;
        uint256 bidAmount;
        uint256 submittedAt;
        BidStatus status;
        string[] documents; // IPFS hashes of bid documents
    }
    
    enum TenderStatus { Draft, Published, Closed, Awarded, Cancelled }
    enum BidStatus { Submitted, Shortlisted, Rejected, Awarded }
    
    // Mapping from tender ID to tender data
    mapping(string => Tender) public tenders;
    
    // Array to store all tender IDs for enumeration
    string[] public tenderIds;
    
    // Mapping from bid ID to bid data
    mapping(string => Bid) public bids;
    
    // Mapping from tender ID to bid IDs for that tender
    mapping(string => string[]) public tenderBids;
    
    // Mapping from user address to bid IDs they've submitted
    mapping(address => string[]) public userBids;
    
    // Events
    event TenderCreated(string tenderId, string title, address createdBy);
    event TenderUpdated(string tenderId, string title, TenderStatus status);
    event TenderStatusChanged(string tenderId, TenderStatus status);
    event BidSubmitted(string bidId, string tenderId, address bidder, uint256 bidAmount);
    event BidStatusChanged(string bidId, string tenderId, BidStatus status);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyOfficer() {
        // This should check if the sender is an officer
        // In a real implementation, this would check against the UserAuthentication contract
        // For now, we'll just check if it's the admin
        require(msg.sender == admin, "Only officers can call this function");
        _;
    }
    
    modifier tenderExists(string memory tenderId) {
        require(tenders[tenderId].createdAt > 0, "Tender does not exist");
        _;
    }
    
    modifier bidExists(string memory bidId) {
        require(bids[bidId].submittedAt > 0, "Bid does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Create a new tender
     * @param tenderId Unique identifier for the tender
     * @param title Tender title
     * @param description Tender description
     * @param estimatedValue Estimated value of the tender
     * @param startDate Start date of the tender
     * @param endDate End date of the tender
     * @param category Tender category
     * @param department Department issuing the tender
     * @param location Location of the tender
     * @param documents IPFS hashes of tender documents
     */
    function createTender(
        string memory tenderId,
        string memory title,
        string memory description,
        uint256 estimatedValue,
        uint256 startDate,
        uint256 endDate,
        string memory category,
        string memory department,
        string memory location,
        string[] memory documents
    ) public onlyOfficer {
        require(tenders[tenderId].createdAt == 0, "Tender ID already exists");
        require(startDate < endDate, "Start date must be before end date");
        
        tenders[tenderId] = Tender({
            id: tenderId,
            title: title,
            description: description,
            estimatedValue: estimatedValue,
            startDate: startDate,
            endDate: endDate,
            createdBy: msg.sender,
            status: TenderStatus.Draft,
            createdAt: block.timestamp,
            category: category,
            department: department,
            location: location,
            documents: documents
        });
        
        tenderIds.push(tenderId);
        
        emit TenderCreated(tenderId, title, msg.sender);
    }
    
    /**
     * @dev Update an existing tender
     * @param tenderId Tender ID to update
     * @param title New title
     * @param description New description
     * @param estimatedValue New estimated value
     * @param startDate New start date
     * @param endDate New end date
     * @param category New category
     * @param department New department
     * @param location New location
     * @param documents New document IPFS hashes
     */
    function updateTender(
        string memory tenderId,
        string memory title,
        string memory description,
        uint256 estimatedValue,
        uint256 startDate,
        uint256 endDate,
        string memory category,
        string memory department,
        string memory location,
        string[] memory documents
    ) public onlyOfficer tenderExists(tenderId) {
        Tender storage tender = tenders[tenderId];
        
        // Only the creator or admin can update the tender
        require(tender.createdBy == msg.sender || msg.sender == admin, "Only the creator or admin can update the tender");
        
        // Can only update if tender is in Draft status
        require(tender.status == TenderStatus.Draft, "Can only update tenders in Draft status");
        
        require(startDate < endDate, "Start date must be before end date");
        
        tender.title = title;
        tender.description = description;
        tender.estimatedValue = estimatedValue;
        tender.startDate = startDate;
        tender.endDate = endDate;
        tender.category = category;
        tender.department = department;
        tender.location = location;
        tender.documents = documents;
        
        emit TenderUpdated(tenderId, title, tender.status);
    }
    
    /**
     * @dev Change the status of a tender
     * @param tenderId Tender ID to update
     * @param status New status
     */
    function changeTenderStatus(string memory tenderId, TenderStatus status) public onlyOfficer tenderExists(tenderId) {
        Tender storage tender = tenders[tenderId];
        
        // Only the creator or admin can change the status
        require(tender.createdBy == msg.sender || msg.sender == admin, "Only the creator or admin can change the status");
        
        // Validate status transitions
        if (status == TenderStatus.Published) {
            require(tender.status == TenderStatus.Draft, "Can only publish from Draft status");
            require(block.timestamp <= tender.endDate, "Cannot publish a tender that has already ended");
        } else if (status == TenderStatus.Closed) {
            require(tender.status == TenderStatus.Published, "Can only close from Published status");
        } else if (status == TenderStatus.Awarded) {
            require(tender.status == TenderStatus.Closed, "Can only award from Closed status");
        } else if (status == TenderStatus.Cancelled) {
            // Can cancel from any status except Awarded
            require(tender.status != TenderStatus.Awarded, "Cannot cancel an awarded tender");
        }
        
        tender.status = status;
        
        emit TenderStatusChanged(tenderId, status);
    }
    
    /**
     * @dev Submit a bid for a tender
     * @param bidId Unique identifier for the bid
     * @param tenderId Tender ID to bid on
     * @param bidAmount Bid amount
     * @param documents IPFS hashes of bid documents
     */
    function submitBid(
        string memory bidId,
        string memory tenderId,
        uint256 bidAmount,
        string[] memory documents
    ) public tenderExists(tenderId) {
        require(bids[bidId].submittedAt == 0, "Bid ID already exists");
        
        Tender storage tender = tenders[tenderId];
        
        // Check if tender is published and not ended
        require(tender.status == TenderStatus.Published, "Tender is not open for bidding");
        require(block.timestamp >= tender.startDate, "Tender bidding has not started yet");
        require(block.timestamp <= tender.endDate, "Tender bidding has ended");
        
        // Create the bid
        bids[bidId] = Bid({
            id: bidId,
            tenderId: tenderId,
            bidder: msg.sender,
            bidAmount: bidAmount,
            submittedAt: block.timestamp,
            status: BidStatus.Submitted,
            documents: documents
        });
        
        // Add bid to tender's bids
        tenderBids[tenderId].push(bidId);
        
        // Add bid to user's bids
        userBids[msg.sender].push(bidId);
        
        emit BidSubmitted(bidId, tenderId, msg.sender, bidAmount);
    }
    
    /**
     * @dev Change the status of a bid
     * @param bidId Bid ID to update
     * @param status New status
     */
    function changeBidStatus(string memory bidId, BidStatus status) public onlyOfficer bidExists(bidId) {
        Bid storage bid = bids[bidId];
        Tender storage tender = tenders[bid.tenderId];
        
        // Only the tender creator or admin can change bid status
        require(tender.createdBy == msg.sender || msg.sender == admin, "Only the tender creator or admin can change bid status");
        
        // Validate status transitions
        if (status == BidStatus.Shortlisted) {
            require(bid.status == BidStatus.Submitted, "Can only shortlist from Submitted status");
            require(tender.status == TenderStatus.Closed, "Tender must be closed to shortlist bids");
        } else if (status == BidStatus.Rejected) {
            require(bid.status == BidStatus.Submitted || bid.status == BidStatus.Shortlisted, "Invalid status transition to Rejected");
        } else if (status == BidStatus.Awarded) {
            require(bid.status == BidStatus.Shortlisted, "Can only award from Shortlisted status");
            require(tender.status == TenderStatus.Closed, "Tender must be closed to award bids");
            
            // When awarding a bid, also change the tender status to Awarded
            tender.status = TenderStatus.Awarded;
            emit TenderStatusChanged(bid.tenderId, TenderStatus.Awarded);
        }
        
        bid.status = status;
        
        emit BidStatusChanged(bidId, bid.tenderId, status);
    }
    
    /**
     * @dev Get tender details
     * @param tenderId Tender ID to query
     * @return id Tender ID
     * @return title Tender title
     * @return description Tender description
     * @return estimatedValue Tender estimated value
     * @return startDate Tender start date
     * @return endDate Tender end date
     * @return createdBy Tender creator address
     * @return status Tender status
     * @return createdAt Tender creation timestamp
     * @return category Tender category
     * @return department Tender department
     * @return location Tender location
     */
    function getTender(string memory tenderId) public view tenderExists(tenderId) returns (
        string memory id,
        string memory title,
        string memory description,
        uint256 estimatedValue,
        uint256 startDate,
        uint256 endDate,
        address createdBy,
        TenderStatus status,
        uint256 createdAt,
        string memory category,
        string memory department,
        string memory location
    ) {
        Tender memory tender = tenders[tenderId];
        return (
            tender.id,
            tender.title,
            tender.description,
            tender.estimatedValue,
            tender.startDate,
            tender.endDate,
            tender.createdBy,
            tender.status,
            tender.createdAt,
            tender.category,
            tender.department,
            tender.location
        );
    }
    
    /**
     * @dev Get tender documents
     * @param tenderId Tender ID to query
     * @return Array of document IPFS hashes
     */
    function getTenderDocuments(string memory tenderId) public view tenderExists(tenderId) returns (string[] memory) {
        return tenders[tenderId].documents;
    }
    
    /**
     * @dev Get bid details
     * @param bidId Bid ID to query
     * @return id Bid ID
     * @return tenderId Associated tender ID
     * @return bidder Bidder address
     * @return bidAmount Bid amount
     * @return submittedAt Bid submission timestamp
     * @return status Bid status
     */
    function getBid(string memory bidId) public view bidExists(bidId) returns (
        string memory id,
        string memory tenderId,
        address bidder,
        uint256 bidAmount,
        uint256 submittedAt,
        BidStatus status
    ) {
        Bid memory bid = bids[bidId];
        return (
            bid.id,
            bid.tenderId,
            bid.bidder,
            bid.bidAmount,
            bid.submittedAt,
            bid.status
        );
    }
    
    /**
     * @dev Get bid documents
     * @param bidId Bid ID to query
     * @return Array of document IPFS hashes
     */
    function getBidDocuments(string memory bidId) public view bidExists(bidId) returns (string[] memory) {
        return bids[bidId].documents;
    }
    
    /**
     * @dev Get all bids for a tender
     * @param tenderId Tender ID to query
     * @return Array of bid IDs
     */
    function getTenderBids(string memory tenderId) public view tenderExists(tenderId) returns (string[] memory) {
        return tenderBids[tenderId];
    }
    
    /**
     * @dev Get all bids submitted by a user
     * @param userAddress User address to query
     * @return Array of bid IDs
     */
    function getUserBids(address userAddress) public view returns (string[] memory) {
        return userBids[userAddress];
    }
    
    /**
     * @dev Get the total number of tenders
     * @return The number of tenders
     */
    function getTenderCount() public view returns (uint256) {
        return tenderIds.length;
    }
    
    /**
     * @dev Get all tender IDs
     * @return Array of all tender IDs
     */
    function getAllTenderIds() public view returns (string[] memory) {
        return tenderIds;
    }
    
    /**
     * @dev Transfer admin rights to a new address
     * @param newAdmin The new admin address
     */
    function transferAdmin(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }
}
