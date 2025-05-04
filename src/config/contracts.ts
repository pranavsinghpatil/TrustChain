// Contract addresses
export const CONTRACT_ADDRESSES = {
  database: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  officerManagement: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  userAuthentication: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  tenderManagement: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  bidManagement: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
};

// Contract ABIs
export const CONTRACT_ABI = {
  OFFICER_MANAGEMENT: [
    // Officer Management functions
    "function appointOfficer(address _officerAddress, string memory _name, bool _canCreateTenders, bool _canApproveBids) external",
    "function removeOfficer(address _officerAddress) external",
    "function updateOfficerPermissions(address _officerAddress, bool _canCreateTenders, bool _canApproveBids) external",
    "function getActiveOfficers() external view returns (address[] memory)",
    "function getOfficer(address _officerAddress) external view returns (tuple(string name, bool canCreateTenders, bool canApproveBids, bool isActive))",
    // Events
    "event OfficerAppointed(address indexed officer, string name)",
    "event OfficerRemoved(address indexed officer)",
    "event OfficerPermissionsUpdated(address indexed officer, bool canCreate, bool canApprove)"
  ],
  USER_AUTHENTICATION: [
    // User Authentication functions
    "function registerUser(string memory _name, string memory _email) public",
    "function loginUser(address _userAddress) public view returns (bool)",
    "function getUserDetails(address _userAddress) public view returns (tuple(string name, string email, bool isRegistered))",
    "function updateUserDetails(string memory _name, string memory _email) public",
    // Events
    "event UserRegistered(address indexed user, string name)",
    "event UserUpdated(address indexed user, string name)"
  ],
  TENDER_MANAGEMENT: [
    // Tender Management functions
    "function createTender(string memory _title, string memory _description, string memory _documentCid, uint256 _budget, uint256 _deadline) public",
    "function getTender(uint256 _tenderId) public view returns (tuple(uint256 id, string title, string description, string documentCid, uint256 budget, uint256 deadline, address creator, uint8 status))",
    "function getAllTenders() public view returns (tuple(uint256 id, string title, string description, string documentCid, uint256 budget, uint256 deadline, address creator, uint8 status)[] memory)",
    "function closeTender(uint256 _tenderId) public",
    "function cancelTender(uint256 _tenderId) public",
    "function placeBid(uint256 _tenderId, uint256 _amount, string memory _proposalCid) public",
    "function getBid(uint256 _tenderId, address _bidder) public view returns (tuple(address bidder, uint256 amount, string proposalCid, uint8 status))",
    "function getAllBids(uint256 _tenderId) public view returns (tuple(address bidder, uint256 amount, string proposalCid, uint8 status)[] memory)",
    "function approveBid(uint256 _tenderId, address _bidder) public",
    "function rejectBid(uint256 _tenderId, address _bidder) public",
    // Events
    "event TenderCreated(uint256 indexed tenderId, address indexed creator, string title)",
    "event TenderClosed(uint256 indexed tenderId)",
    "event TenderCancelled(uint256 indexed tenderId)",
    "event BidPlaced(uint256 indexed tenderId, address indexed bidder, uint256 amount)",
    "event BidApproved(uint256 indexed tenderId, address indexed bidder)",
    "event BidRejected(uint256 indexed tenderId, address indexed bidder)"
  ]
};
