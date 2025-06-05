// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AdminManagement is Ownable {
    using Strings for uint256;

    // Events
    event OfficerAppointed(address indexed officer, string name);
    event OfficerRemoved(address indexed officer);
    event OfficerPermissionsUpdated(address indexed officer, bool canCreate, bool canApprove);

    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {}

    // Officer struct
    struct Officer {
        string name;
        bool canCreateTenders;
        bool canApproveBids;
        bool isActive;
    }

    // Mapping of officers
    mapping(address => Officer) public officers;
    address[] public officerList;

    // Modifier to check if caller is an officer
    modifier onlyOfficer() {
        require(officers[msg.sender].isActive, "Caller is not an officer");
        _;
    }

    // Modifier to check if caller has specific permission
    modifier onlyWithPermission(bool createPermission, bool approvePermission) {
        require(
            officers[msg.sender].canCreateTenders == createPermission &&
            officers[msg.sender].canApproveBids == approvePermission,
            "Caller does not have required permissions"
        );
        _;
    }

    // Appoint a new officer
    function appointOfficer(
        address _officerAddress,
        string memory _name,
        bool _canCreateTenders,
        bool _canApproveBids
    ) public onlyOwner {
        require(_officerAddress != address(0), "Invalid address");
        require(!officers[_officerAddress].isActive, "Officer already exists");

        officers[_officerAddress] = Officer(
            _name,
            _canCreateTenders,
            _canApproveBids,
            true
        );
        officerList.push(_officerAddress);

        emit OfficerAppointed(_officerAddress, _name);
    }

    // Remove an officer
    function removeOfficer(address _officerAddress) public onlyOwner {
        require(officers[_officerAddress].isActive, "Officer does not exist");
        
        officers[_officerAddress].isActive = false;
        emit OfficerRemoved(_officerAddress);
    }

    // Update officer permissions
    function updateOfficerPermissions(
        address _officerAddress,
        bool _canCreateTenders,
        bool _canApproveBids
    ) public onlyOwner {
        require(officers[_officerAddress].isActive, "Officer does not exist");
        
        officers[_officerAddress].canCreateTenders = _canCreateTenders;
        officers[_officerAddress].canApproveBids = _canApproveBids;
        
        emit OfficerPermissionsUpdated(
            _officerAddress,
            _canCreateTenders,
            _canApproveBids
        );
    }

    // Get all active officers
    function getActiveOfficers() public view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < officerList.length; i++) {
            if (officers[officerList[i]].isActive) {
                count++;
            }
        }

        address[] memory activeOfficers = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < officerList.length; i++) {
            if (officers[officerList[i]].isActive) {
                activeOfficers[index] = officerList[i];
                index++;
            }
        }
        return activeOfficers;
    }

    // Get officer details
    function getOfficer(address _officerAddress) public view returns (Officer memory) {
        return officers[_officerAddress];
    }
}
