// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Database is Ownable {
    using Strings for uint256;

    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {}

    // User roles
    enum UserRole {
        ADMIN,
        OFFICER,
        BIDDER
    }

    // User struct
    struct User {
        string name;
        string username;
        string email;
        address walletAddress;
        UserRole role;
        bool isApproved;
        string approvalRemark;
        uint256 createdAt;
    }

    // Tender struct
    struct Tender {
        uint256 id;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        address officerAddress;
        bool isActive;
        uint256 createdAt;
    }

    // Bid struct
    struct Bid {
        uint256 tenderId;
        address bidderAddress;
        uint256 amount;
        string description;
        uint256 submittedAt;
    }

    // Mappings
    mapping(address => User) public users;
    mapping(string => bool) public usernames;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => Bid[]) public bids;
    uint256 public tenderCount;

    // Events
    event UserRegistered(address indexed user, string username, UserRole role);
    event UserApproved(address indexed user, string username, bool approved);
    event TenderCreated(uint256 indexed id, string title, address officer);
    event BidSubmitted(uint256 indexed tenderId, address indexed bidder, uint256 amount);

    // User management
    function registerUser(
        string memory _name,
        string memory _username,
        string memory _email,
        UserRole _role
    ) public {
        require(!usernames[_username], "Username already exists");
        require(users[msg.sender].walletAddress == address(0), "User already registered");

        users[msg.sender] = User(
            _name,
            _username,
            _email,
            msg.sender,
            _role,
            false,
            "",
            block.timestamp
        );
        usernames[_username] = true;

        emit UserRegistered(msg.sender, _username, _role);
    }

    function approveUser(address _user, bool _approved, string memory _remark) public onlyOwner {
        require(users[_user].walletAddress != address(0), "User not registered");
        
        users[_user].isApproved = _approved;
        users[_user].approvalRemark = _remark;

        emit UserApproved(_user, users[_user].username, _approved);
    }

    // Tender management
    function createTender(
        string memory _title,
        string memory _description,
        uint256 _budget,
        uint256 _deadline
    ) public {
        require(users[msg.sender].role == UserRole.OFFICER, "Only officers can create tenders");
        require(users[msg.sender].isApproved, "User not approved");

        tenderCount++;
        tenders[tenderCount] = Tender(
            tenderCount,
            _title,
            _description,
            _budget,
            _deadline,
            msg.sender,
            true,
            block.timestamp
        );

        emit TenderCreated(tenderCount, _title, msg.sender);
    }

    function submitBid(
        uint256 _tenderId,
        uint256 _amount,
        string memory _description
    ) public {
        require(tenders[_tenderId].isActive, "Tender is not active");
        require(block.timestamp <= tenders[_tenderId].deadline, "Tender deadline passed");
        require(users[msg.sender].role == UserRole.BIDDER, "Only bidders can submit bids");
        require(users[msg.sender].isApproved, "User not approved");

        bids[_tenderId].push(Bid(
            _tenderId,
            msg.sender,
            _amount,
            _description,
            block.timestamp
        ));

        emit BidSubmitted(_tenderId, msg.sender, _amount);
    }

    // View functions
    function getUser(address _user) public view returns (User memory) {
        return users[_user];
    }

    function getTender(uint256 _id) public view returns (Tender memory) {
        return tenders[_id];
    }

    function getBids(uint256 _tenderId) public view returns (Bid[] memory) {
        return bids[_tenderId];
    }

    function getActiveTenders() public view returns (Tender[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= tenderCount; i++) {
            if (tenders[i].isActive) {
                count++;
            }
        }

        Tender[] memory activeTenders = new Tender[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= tenderCount; i++) {
            if (tenders[i].isActive) {
                activeTenders[index] = tenders[i];
                index++;
            }
        }
        return activeTenders;
    }
}
