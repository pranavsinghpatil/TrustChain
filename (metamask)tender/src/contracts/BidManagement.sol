// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract BidManagement is Ownable {
    using Strings for uint256;

    // Events
    event BidFeedbackGiven(uint256 indexed tenderId, uint256 indexed bidIndex, string feedback);
    event BidModificationRequested(uint256 indexed tenderId, uint256 indexed bidIndex, string modifications);
    event BidModified(uint256 indexed tenderId, uint256 indexed bidIndex, uint256 newAmount, string newDescription);
    event BidRejectedWithReason(uint256 indexed tenderId, uint256 indexed bidIndex, string reason);
    event BidSubmitted(uint256 indexed tenderId, uint256 indexed bidIndex, address bidder, uint256 amount);

    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {}

    // Bid status enum
    enum BidStatus {
        PENDING,
        APPROVED,
        REJECTED,
        MODIFIED,
        MODIFICATION_REQUESTED
    }

    // Bid struct
    struct Bid {
        uint256 tenderId;
        address bidderAddress;
        uint256 amount;
        string description;
        uint256 submittedAt;
        BidStatus status;
        string feedback;
        string modificationRequest;
        string rejectionReason;
    }

    // Mapping of bids
    mapping(uint256 => mapping(uint256 => Bid)) public bids;
    mapping(uint256 => uint256) public bidCounts;

    // Tender information
    struct Tender {
        address officerAddress;
        bool isActive;
        uint256 deadline;
    }

    // Mapping of tenders
    mapping(uint256 => Tender) public tenders;

    // Modifier to check if caller is tender officer
    modifier onlyTenderOfficer(uint256 _tenderId) {
        require(tenders[_tenderId].officerAddress == msg.sender, "Caller is not tender officer");
        _;
    }

    // Modifier to check if bid exists
    modifier bidExists(uint256 _tenderId, uint256 _bidIndex) {
        require(_bidIndex < bidCounts[_tenderId], "Bid does not exist");
        _;
    }

    // Give feedback on a bid
    function giveBidFeedback(
        uint256 _tenderId,
        uint256 _bidIndex,
        string memory _feedback
    ) public onlyTenderOfficer(_tenderId) bidExists(_tenderId, _bidIndex) {
        require(bids[_tenderId][_bidIndex].status == BidStatus.PENDING, "Bid not in pending state");
        
        bids[_tenderId][_bidIndex].feedback = _feedback;
        emit BidFeedbackGiven(_tenderId, _bidIndex, _feedback);
    }

    // Request bid modification
    function requestBidModification(
        uint256 _tenderId,
        uint256 _bidIndex,
        string memory _modifications
    ) public onlyTenderOfficer(_tenderId) bidExists(_tenderId, _bidIndex) {
        require(bids[_tenderId][_bidIndex].status == BidStatus.PENDING, "Bid not in pending state");
        
        bids[_tenderId][_bidIndex].status = BidStatus.MODIFICATION_REQUESTED;
        bids[_tenderId][_bidIndex].modificationRequest = _modifications;
        
        emit BidModificationRequested(_tenderId, _bidIndex, _modifications);
    }

    // Modify bid (by bidder)
    function modifyBid(
        uint256 _tenderId,
        uint256 _bidIndex,
        uint256 _newAmount,
        string memory _newDescription
    ) public bidExists(_tenderId, _bidIndex) {
        require(bids[_tenderId][_bidIndex].bidderAddress == msg.sender, "Not authorized to modify this bid");
        require(bids[_tenderId][_bidIndex].status == BidStatus.MODIFICATION_REQUESTED, "Bid not in modification requested state");
        
        bids[_tenderId][_bidIndex].amount = _newAmount;
        bids[_tenderId][_bidIndex].description = _newDescription;
        bids[_tenderId][_bidIndex].status = BidStatus.MODIFIED;
        
        emit BidModified(_tenderId, _bidIndex, _newAmount, _newDescription);
    }

    // Reject bid with reason
    function rejectBid(
        uint256 _tenderId,
        uint256 _bidIndex,
        string memory _reason
    ) public onlyTenderOfficer(_tenderId) bidExists(_tenderId, _bidIndex) {
        require(bids[_tenderId][_bidIndex].status == BidStatus.PENDING || bids[_tenderId][_bidIndex].status == BidStatus.MODIFIED, "Bid already processed");
        
        bids[_tenderId][_bidIndex].status = BidStatus.REJECTED;
        bids[_tenderId][_bidIndex].rejectionReason = _reason;
        
        emit BidRejectedWithReason(_tenderId, _bidIndex, _reason);
    }

    // Submit new bid
    function submitBid(
        uint256 _tenderId,
        uint256 _amount,
        string memory _description
    ) public {
        require(tenders[_tenderId].isActive, "Tender is not active");
        require(block.timestamp <= tenders[_tenderId].deadline, "Tender deadline passed");
        
        bidCounts[_tenderId]++;
        uint256 bidIndex = bidCounts[_tenderId] - 1;
        
        bids[_tenderId][bidIndex] = Bid(
            _tenderId,
            msg.sender,
            _amount,
            _description,
            block.timestamp,
            BidStatus.PENDING,
            "",
            "",
            ""
        );
        
        emit BidSubmitted(_tenderId, bidIndex, msg.sender, _amount);
    }

    // View functions
    function getBid(
        uint256 _tenderId,
        uint256 _bidIndex
    ) public view returns (Bid memory) {
        return bids[_tenderId][_bidIndex];
    }

    function getBidsForTender(uint256 _tenderId) public view returns (Bid[] memory) {
        Bid[] memory allBids = new Bid[](bidCounts[_tenderId]);
        for (uint256 i = 0; i < bidCounts[_tenderId]; i++) {
            allBids[i] = bids[_tenderId][i];
        }
        return allBids;
    }

    function getBidsForUser(address _user) public view returns (Bid[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= bidCounts[0]; i++) {
            if (bids[0][i-1].bidderAddress == _user) {
                count++;
            }
        }

        Bid[] memory userBids = new Bid[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= bidCounts[0]; i++) {
            if (bids[0][i-1].bidderAddress == _user) {
                userBids[index] = bids[0][i-1];
                index++;
            }
        }
        return userBids;
    }
}
