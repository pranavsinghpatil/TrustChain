// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OfficerManagement
 * @dev Contract for managing tender officers in the TrustChain system
 */
contract OfficerManagement {
    address public admin;
    
    struct Officer {
        string id;
        string name;
        string username;
        string email;
        bool isActive;
        uint256 createdAt;
    }
    
    // Mapping from wallet address to officer data
    mapping(address => Officer) public officers;
    
    // Array to store all officer addresses for enumeration
    address[] public officerAddresses;
    
    // Mapping from username to boolean to check if username exists
    mapping(string => bool) public usernameExists;
    
    // Events
    event OfficerAdded(address indexed walletAddress, string id, string name, string username);
    event OfficerUpdated(address indexed walletAddress, string name, string username);
    event OfficerRemoved(address indexed walletAddress, string id);
    event OfficerStatusChanged(address indexed walletAddress, bool isActive);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier officerExists(address walletAddress) {
        require(bytes(officers[walletAddress].id).length > 0, "Officer does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Add a new officer
     * @param walletAddress The officer's wallet address
     * @param id Unique identifier for the officer
     * @param name Officer's name
     * @param username Officer's username
     * @param email Officer's email
     */
    function addOfficer(
        address walletAddress,
        string memory id,
        string memory name,
        string memory username,
        string memory email
    ) public onlyAdmin {
        require(bytes(officers[walletAddress].id).length == 0, "Officer already exists for this address");
        require(!usernameExists[username], "Username already exists");
        
        officers[walletAddress] = Officer({
            id: id,
            name: name,
            username: username,
            email: email,
            isActive: true,
            createdAt: block.timestamp
        });
        
        officerAddresses.push(walletAddress);
        usernameExists[username] = true;
        
        emit OfficerAdded(walletAddress, id, name, username);
    }
    
    /**
     * @dev Update an existing officer's details
     * @param walletAddress The officer's wallet address
     * @param name New name
     * @param username New username
     * @param email New email
     */
    function updateOfficer(
        address walletAddress,
        string memory name,
        string memory username,
        string memory email
    ) public onlyAdmin officerExists(walletAddress) {
        string memory currentUsername = officers[walletAddress].username;
        
        // If username is being changed, check if new username exists
        if (keccak256(bytes(currentUsername)) != keccak256(bytes(username))) {
            require(!usernameExists[username], "Username already exists");
            usernameExists[currentUsername] = false;
            usernameExists[username] = true;
        }
        
        officers[walletAddress].name = name;
        officers[walletAddress].username = username;
        officers[walletAddress].email = email;
        
        emit OfficerUpdated(walletAddress, name, username);
    }
    
    /**
     * @dev Remove an officer
     * @param walletAddress The officer's wallet address
     */
    function removeOfficer(address walletAddress) public onlyAdmin officerExists(walletAddress) {
        string memory username = officers[walletAddress].username;
        string memory id = officers[walletAddress].id;
        
        // Remove from username mapping
        usernameExists[username] = false;
        
        // Remove from addresses array
        for (uint i = 0; i < officerAddresses.length; i++) {
            if (officerAddresses[i] == walletAddress) {
                // Replace with the last element and pop
                officerAddresses[i] = officerAddresses[officerAddresses.length - 1];
                officerAddresses.pop();
                break;
            }
        }
        
        // Delete officer data
        delete officers[walletAddress];
        
        emit OfficerRemoved(walletAddress, id);
    }
    
    /**
     * @dev Change officer active status
     * @param walletAddress The officer's wallet address
     * @param isActive New active status
     */
    function setOfficerStatus(address walletAddress, bool isActive) public onlyAdmin officerExists(walletAddress) {
        officers[walletAddress].isActive = isActive;
        emit OfficerStatusChanged(walletAddress, isActive);
    }
    
    /**
     * @dev Get officer details
     * @param walletAddress The officer's wallet address
     * @return id Officer ID
     * @return name Officer name
     * @return username Officer username
     * @return email Officer email
     * @return isActive Officer active status
     * @return createdAt Officer creation timestamp
     */
    function getOfficer(address walletAddress) public view returns (
        string memory id,
        string memory name,
        string memory username,
        string memory email,
        bool isActive,
        uint256 createdAt
    ) {
        Officer memory officer = officers[walletAddress];
        return (
            officer.id,
            officer.name,
            officer.username,
            officer.email,
            officer.isActive,
            officer.createdAt
        );
    }
    
    /**
     * @dev Check if an address is an officer
     * @param walletAddress The wallet address to check
     * @return true if the address is an officer
     */
    function isOfficer(address walletAddress) public view returns (bool) {
        return bytes(officers[walletAddress].id).length > 0;
    }
    
    /**
     * @dev Get the total number of officers
     * @return The number of officers
     */
    function getOfficerCount() public view returns (uint256) {
        return officerAddresses.length;
    }
    
    /**
     * @dev Get all officer addresses
     * @return Array of all officer addresses
     */
    function getAllOfficerAddresses() public view returns (address[] memory) {
        return officerAddresses;
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
