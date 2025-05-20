// Contract addresses
export const CONTRACT_ADDRESSES = {
  OFFICER_MANAGEMENT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  USER_AUTHENTICATION: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  TENDER_MANAGEMENT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
};

// Contract ABIs
export const CONTRACT_ABI = {
  OFFICER_MANAGEMENT: [
    // Officer Management functions
    "function addOfficer(address walletAddress, string memory id, string memory name, string memory username, string memory email) external",
    "function updateOfficer(address walletAddress, string memory name, string memory username, string memory email) external",
    "function removeOfficer(address walletAddress) external",
    "function setOfficerStatus(address walletAddress, bool isActive) external",
    "function getOfficer(address walletAddress) external view returns (tuple(string id, string name, string username, string email, bool isActive, uint256 createdAt))",
    "function getAllOfficerAddresses() external view returns (address[] memory)",
    "function isOfficer(address walletAddress) external view returns (bool)",
    // Events
    "event OfficerAdded(address indexed walletAddress, string id, string name, string username)",
    "event OfficerUpdated(address indexed walletAddress, string name, string username)",
    "event OfficerRemoved(address indexed walletAddress, string id)",
    "event OfficerStatusChanged(address indexed walletAddress, bool isActive)"
  ],
  USER_AUTHENTICATION: [
    // User Authentication functions
    "function registerUser(address walletAddress, string memory id, string memory name, string memory username, string memory email, string memory role, string memory companyName, string memory registrationNumber, string memory gstNumber, string memory panNumber, uint256 establishmentYear, string memory registeredAddress, string memory state, string memory city, string memory pinCode, string memory bidderType) external",
    "function updateUser(address walletAddress, string memory name, string memory username, string memory email) external",
    "function setUserApproval(address walletAddress, bool isApproved, string memory remark) external",
    "function removeUser(address walletAddress) external",
    "function getUser(address walletAddress) external view returns (tuple(string id, string name, string username, string email, string role, bool isApproved, string approvalRemark, uint256 createdAt))",
    "function getCompanyDetails(address walletAddress) external view returns (tuple(string companyName, string registrationNumber, string gstNumber, string panNumber, uint256 establishmentYear, string registeredAddress, string state, string city, string pinCode, string bidderType))",
    "function isUser(address walletAddress) external view returns (bool)",
    "function isAdmin(address walletAddress) external view returns (bool)",
    "function isOfficer(address walletAddress) external view returns (bool)",
    // Events
    "event UserRegistered(address indexed walletAddress, string id, string username, string role)",
    "event UserUpdated(address indexed walletAddress, string username)",
    "event UserApprovalChanged(address indexed walletAddress, bool isApproved, string remark)",
    "event UserRemoved(address indexed walletAddress, string id)"
  ],
  TENDER_MANAGEMENT: [
    // Tender Management functions
    "function createTender(string memory id, string memory title, string memory description, uint256 estimatedValue, uint256 startDate, uint256 endDate, string memory category, string memory department, string memory location, string[] memory documents) external",
    "function updateTender(string memory tenderId, string memory title, string memory description, uint256 estimatedValue, uint256 startDate, uint256 endDate, string memory category, string memory department, string memory location, string[] memory documents) external",
    "function changeTenderStatus(string memory tenderId, uint8 status) external",
    "function closeTender(string memory tenderId) external",
    "function cancelTender(string memory tenderId) external",
    "function getTender(string memory tenderId) external view returns (tuple(string id, string title, string description, uint256 estimatedValue, uint256 startDate, uint256 endDate, address createdBy, uint8 status, uint256 createdAt, string category, string department, string location, string[] documents))",
    "function getAllTenderIds() external view returns (string[] memory)",
    "function getTenderCount() external view returns (uint256)",
    // Events
    "event TenderCreated(string indexed tenderId, address indexed creator, string title)",
    "event TenderUpdated(string indexed tenderId, string title, uint8 status)",
    "event TenderUpdated(string indexed tenderId, string title)",
    "event TenderClosed(string indexed tenderId)",
    "event TenderCancelled(string indexed tenderId)"
  ]
};
