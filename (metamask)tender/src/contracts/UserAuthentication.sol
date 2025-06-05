// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UserAuthentication
 * @dev Contract for managing user authentication in the TrustChain system
 */
contract UserAuthentication {
    address public admin;
    
    struct User {
        string id;
        string name;
        string username;
        string email;
        string role; // "admin", "officer", "bidder"
        bool isApproved;
        string approvalRemark;
        uint256 createdAt;
        // Additional user details
        string companyName;
        string registrationNumber;
        string gstNumber;
        string panNumber;
        uint256 establishmentYear;
        string registeredAddress;
        string state;
        string city;
        string pinCode;
        string bidderType;
    }
    
    // Mapping from wallet address to user data
    mapping(address => User) public users;
    
    // Mapping from username to wallet address
    mapping(string => address) public usernameToAddress;
    
    // Array to store all user addresses for enumeration
    address[] public userAddresses;
    
    // Mapping from username to boolean to check if username exists
    mapping(string => bool) public usernameExists;
    
    // Events
    event UserRegistered(address indexed walletAddress, string id, string username, string role);
    event UserUpdated(address indexed walletAddress, string username);
    event UserApprovalChanged(address indexed walletAddress, bool isApproved, string remark);
    event UserRemoved(address indexed walletAddress, string id);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin || keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")), "Only admin can call this function");
        _;
    }
    
    modifier userExists(address walletAddress) {
        require(bytes(users[walletAddress].id).length > 0, "User does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        
        // Register the deployer as the first admin
        users[msg.sender] = User({
            id: "admin-1",
            name: "System Admin",
            username: "admin",
            email: "admin@trustchain.com",
            role: "admin",
            isApproved: true,
            approvalRemark: "",
            createdAt: block.timestamp,
            companyName: "TrustChain",
            registrationNumber: "TC001",
            gstNumber: "",
            panNumber: "",
            establishmentYear: 2023,
            registeredAddress: "Blockchain HQ",
            state: "Decentraland",
            city: "Crypto City",
            pinCode: "000000",
            bidderType: ""
        });
        
        usernameToAddress["admin"] = msg.sender;
        usernameExists["admin"] = true;
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, "admin-1", "admin", "admin");
    }
    
    /**
     * @dev Register a new user
     * @param walletAddress The user's wallet address
     * @param id Unique identifier for the user
     * @param name User's name
     * @param username User's username
     * @param email User's email
     * @param role User's role
     * @param companyName Company name
     * @param registrationNumber Company registration number
     * @param gstNumber GST number
     * @param panNumber PAN number
     * @param establishmentYear Establishment year
     * @param registeredAddress Registered address
     * @param state State
     * @param city City
     * @param pinCode Pin code
     * @param bidderType Bidder type
     */
    function registerUser(
        address walletAddress,
        string memory id,
        string memory name,
        string memory username,
        string memory email,
        string memory role,
        string memory companyName,
        string memory registrationNumber,
        string memory gstNumber,
        string memory panNumber,
        uint256 establishmentYear,
        string memory registeredAddress,
        string memory state,
        string memory city,
        string memory pinCode,
        string memory bidderType
    ) public {
        // For bidders, anyone can register themselves
        // For officers, only admin can register
        if (keccak256(bytes(role)) == keccak256(bytes("officer"))) {
            require(msg.sender == admin || keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")), "Only admin can register officers");
        }
        
        require(bytes(users[walletAddress].id).length == 0, "User already exists for this address");
        require(!usernameExists[username], "Username already exists");
        
        // For bidders, they need approval. Officers are auto-approved
        bool isApproved = keccak256(bytes(role)) == keccak256(bytes("officer"));
        
        users[walletAddress] = User({
            id: id,
            name: name,
            username: username,
            email: email,
            role: role,
            isApproved: isApproved,
            approvalRemark: "",
            createdAt: block.timestamp,
            companyName: companyName,
            registrationNumber: registrationNumber,
            gstNumber: gstNumber,
            panNumber: panNumber,
            establishmentYear: establishmentYear,
            registeredAddress: registeredAddress,
            state: state,
            city: city,
            pinCode: pinCode,
            bidderType: bidderType
        });
        
        userAddresses.push(walletAddress);
        usernameToAddress[username] = walletAddress;
        usernameExists[username] = true;
        
        emit UserRegistered(walletAddress, id, username, role);
    }
    
    /**
     * @dev Update an existing user's details
     * @param walletAddress The user's wallet address
     * @param name New name
     * @param username New username
     * @param email New email
     */
    function updateUser(
        address walletAddress,
        string memory name,
        string memory username,
        string memory email
    ) public userExists(walletAddress) {
        // Only admin or the user themselves can update their details
        require(msg.sender == admin || keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")) || msg.sender == walletAddress, 
                "Only admin or the user themselves can update user details");
        
        string memory currentUsername = users[walletAddress].username;
        
        // If username is being changed, check if new username exists
        if (keccak256(bytes(currentUsername)) != keccak256(bytes(username))) {
            require(!usernameExists[username], "Username already exists");
            usernameExists[currentUsername] = false;
            usernameExists[username] = true;
            
            // Update username mapping
            delete usernameToAddress[currentUsername];
            usernameToAddress[username] = walletAddress;
        }
        
        users[walletAddress].name = name;
        users[walletAddress].username = username;
        users[walletAddress].email = email;
        
        emit UserUpdated(walletAddress, username);
    }
    
    /**
     * @dev Update a user's company details
     * @param walletAddress The user's wallet address
     * @param companyName Company name
     * @param registrationNumber Company registration number
     * @param gstNumber GST number
     * @param panNumber PAN number
     * @param establishmentYear Establishment year
     * @param registeredAddress Registered address
     * @param state State
     * @param city City
     * @param pinCode Pin code
     * @param bidderType Bidder type
     */
    function updateCompanyDetails(
        address walletAddress,
        string memory companyName,
        string memory registrationNumber,
        string memory gstNumber,
        string memory panNumber,
        uint256 establishmentYear,
        string memory registeredAddress,
        string memory state,
        string memory city,
        string memory pinCode,
        string memory bidderType
    ) public userExists(walletAddress) {
        // Only admin or the user themselves can update their details
        require(msg.sender == admin || keccak256(bytes(users[msg.sender].role)) == keccak256(bytes("admin")) || msg.sender == walletAddress, 
                "Only admin or the user themselves can update company details");
        
        User storage user = users[walletAddress];
        
        user.companyName = companyName;
        user.registrationNumber = registrationNumber;
        user.gstNumber = gstNumber;
        user.panNumber = panNumber;
        user.establishmentYear = establishmentYear;
        user.registeredAddress = registeredAddress;
        user.state = state;
        user.city = city;
        user.pinCode = pinCode;
        user.bidderType = bidderType;
        
        emit UserUpdated(walletAddress, user.username);
    }
    
    /**
     * @dev Approve or reject a user
     * @param walletAddress The user's wallet address
     * @param isApproved Approval status
     * @param remark Approval or rejection remark
     */
    function setUserApproval(
        address walletAddress,
        bool isApproved,
        string memory remark
    ) public onlyAdmin userExists(walletAddress) {
        users[walletAddress].isApproved = isApproved;
        users[walletAddress].approvalRemark = remark;
        
        emit UserApprovalChanged(walletAddress, isApproved, remark);
    }
    
    /**
     * @dev Remove a user
     * @param walletAddress The user's wallet address
     */
    function removeUser(address walletAddress) public onlyAdmin userExists(walletAddress) {
        string memory username = users[walletAddress].username;
        string memory id = users[walletAddress].id;
        
        // Remove from username mappings
        delete usernameToAddress[username];
        usernameExists[username] = false;
        
        // Remove from addresses array
        for (uint i = 0; i < userAddresses.length; i++) {
            if (userAddresses[i] == walletAddress) {
                // Replace with the last element and pop
                userAddresses[i] = userAddresses[userAddresses.length - 1];
                userAddresses.pop();
                break;
            }
        }
        
        // Delete user data
        delete users[walletAddress];
        
        emit UserRemoved(walletAddress, id);
    }
    
    /**
     * @dev Get user details by wallet address
     * @param walletAddress The user's wallet address
     * @return id User ID
     * @return name User name
     * @return username User username
     * @return email User email
     * @return role User role
     * @return isApproved User approval status
     * @return approvalRemark User approval remark
     * @return createdAt User creation timestamp
     */
    function getUserByAddress(address walletAddress) public view returns (
        string memory id,
        string memory name,
        string memory username,
        string memory email,
        string memory role,
        bool isApproved,
        string memory approvalRemark,
        uint256 createdAt
    ) {
        User memory user = users[walletAddress];
        return (
            user.id,
            user.name,
            user.username,
            user.email,
            user.role,
            user.isApproved,
            user.approvalRemark,
            user.createdAt
        );
    }
    
    /**
     * @dev Get user details by username
     * @param username The username to look up
     * @return walletAddress User's wallet address
     * @return id User ID
     * @return name User name
     * @return email User email
     * @return role User role
     * @return isApproved User approval status
     * @return approvalRemark User approval remark
     * @return createdAt User creation timestamp
     */
    function getUserByUsername(string memory username) public view returns (
        address walletAddress,
        string memory id,
        string memory name,
        string memory email,
        string memory role,
        bool isApproved,
        string memory approvalRemark,
        uint256 createdAt
    ) {
        address userAddress = usernameToAddress[username];
        require(userAddress != address(0), "Username not found");
        
        User memory user = users[userAddress];
        return (
            userAddress,
            user.id,
            user.name,
            user.email,
            user.role,
            user.isApproved,
            user.approvalRemark,
            user.createdAt
        );
    }
    
    /**
     * @dev Get user company details
     * @param walletAddress The user's wallet address
     * @return companyName Company name
     * @return registrationNumber Registration number
     * @return gstNumber GST number
     * @return panNumber PAN number
     * @return establishmentYear Establishment year
     * @return registeredAddress Registered address
     * @return state State
     * @return city City
     * @return pinCode Pin code
     * @return bidderType Bidder type
     */
    function getCompanyDetails(address walletAddress) public view returns (
        string memory companyName,
        string memory registrationNumber,
        string memory gstNumber,
        string memory panNumber,
        uint256 establishmentYear,
        string memory registeredAddress,
        string memory state,
        string memory city,
        string memory pinCode,
        string memory bidderType
    ) {
        User memory user = users[walletAddress];
        return (
            user.companyName,
            user.registrationNumber,
            user.gstNumber,
            user.panNumber,
            user.establishmentYear,
            user.registeredAddress,
            user.state,
            user.city,
            user.pinCode,
            user.bidderType
        );
    }
    
    /**
     * @dev Check if an address is a user
     * @param walletAddress The wallet address to check
     * @return true if the address is a user
     */
    function isUser(address walletAddress) public view returns (bool) {
        return bytes(users[walletAddress].id).length > 0;
    }
    
    /**
     * @dev Check if an address is an admin
     * @param walletAddress The wallet address to check
     * @return true if the address is an admin
     */
    function isAdmin(address walletAddress) public view returns (bool) {
        return keccak256(bytes(users[walletAddress].role)) == keccak256(bytes("admin"));
    }
    
    /**
     * @dev Check if an address is an officer
     * @param walletAddress The wallet address to check
     * @return true if the address is an officer
     */
    function isOfficer(address walletAddress) public view returns (bool) {
        return keccak256(bytes(users[walletAddress].role)) == keccak256(bytes("officer"));
    }
    
    /**
     * @dev Get the total number of users
     * @return The number of users
     */
    function getUserCount() public view returns (uint256) {
        return userAddresses.length;
    }
    
    /**
     * @dev Get all user addresses
     * @return Array of all user addresses
     */
    function getAllUserAddresses() public view returns (address[] memory) {
        return userAddresses;
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
