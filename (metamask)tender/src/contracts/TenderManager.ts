import { ethers } from 'ethers';

export interface Tender {
  id: number;
  title: string;
  description: string;
  deadline: number;
  minBid: ethers.BigNumber;
  ownerAddress: string;
  status: number;
  winningBidId: number;
  createdAt: number;
  documentHash: string;
  isPrivate: boolean;
  allowedBidders: string[];
}

export interface Bid {
  id: number;
  tenderId: number;
  bidderAddress: string;
  bidAmount: ethers.BigNumber;
  timestamp: number;
  proposal: string;
}

export class TenderManager extends ethers.Contract {
  // Events
  static readonly abi = [
    // Events
    "event TenderCreated(uint256 indexed tenderId, address indexed owner, string title, uint256 deadline, bool isPrivate, bytes32 documentHash)",
    "event BidSubmitted(uint256 indexed tenderId, uint256 indexed bidId, address indexed bidder, uint256 amount, string proposal)",
    "event TenderClosed(uint256 indexed tenderId, uint256 indexed winningBidId, address indexed winner, uint256 winningAmount)",
    "event TenderCancelled(uint256 indexed tenderId, address indexed owner)",
    "event VendorApproved(uint256 indexed tenderId, address indexed vendor, address indexed approvedBy)",
    "event VendorRevoked(uint256 indexed tenderId, address indexed vendor, address indexed revokedBy)",
    
    // Functions
    "function createTender(string memory _title, string memory _description, uint256 _deadline, uint256 _minBid, bytes32 _documentHash, bool _isPrivate, address[] memory _allowedBidders) external returns (uint256)",
    "function submitBid(uint256 _tenderId, uint256 _amount, string memory _proposal) external",
    "function closeTender(uint256 _tenderId) external",
    "function cancelTender(uint256 _tenderId) external",
    "function approveVendor(uint256 _tenderId, address _vendor) external",
    "function bulkApproveVendors(uint256 _tenderId, address[] memory _vendors) external",
    "function revokeVendor(uint256 _tenderId, address _vendor) external",
    "function getTender(uint256 _tenderId) external view returns (string memory, string memory, uint256, uint256, address, uint8, uint256, uint256, bytes32, bool, uint256)",
    "function getAllTenders(uint256 _offset, uint256 _limit) external view returns (uint256[] memory, string[] memory, address[] memory, uint8[] memory, uint256[] memory, uint256[] memory, uint256[] memory)",
    "function getTenderBids(uint256 _tenderId, uint256 _offset, uint256 _limit) external view returns (uint256[] memory, address[] memory, uint256[] memory, uint256[] memory, string[] memory)",
    "function getTenderCount() external view returns (uint256)",
    "function getTenderBidsCount(uint256 _tenderId) external view returns (uint256)",
    "function getApprovedVendors(uint256 _tenderId) external view returns (address[] memory)"
  ];

  constructor(address: string, signer: ethers.Signer) {
    super(address, TenderManager.abi, signer);
  }

  // Contract functions
  async createTender(
    title: string,
    description: string,
    deadline: number,
    minBid: ethers.BigNumber,
    documentHash: string,
    isPrivate: boolean,
    allowedBidders: string[]
  ): Promise<ethers.ContractTransaction> {
    return this.functions.createTender(
      title,
      description,
      deadline,
      minBid,
      documentHash,
      isPrivate,
      allowedBidders
    );
  }

  async submitBid(
    tenderId: number,
    amount: ethers.BigNumber,
    proposal: string
  ): Promise<ethers.ContractTransaction> {
    return this.functions.submitBid(tenderId, amount, proposal);
  }

  async closeTender(tenderId: number): Promise<ethers.ContractTransaction> {
    return this.functions.closeTender(tenderId);
  }

  async cancelTender(tenderId: number): Promise<ethers.ContractTransaction> {
    return this.functions.cancelTender(tenderId);
  }

  async approveVendor(
    tenderId: number,
    vendor: string
  ): Promise<ethers.ContractTransaction> {
    return this.functions.approveVendor(tenderId, vendor);
  }

  async bulkApproveVendors(
    tenderId: number,
    vendors: string[]
  ): Promise<ethers.ContractTransaction> {
    return this.functions.bulkApproveVendors(tenderId, vendors);
  }

  async revokeVendor(
    tenderId: number,
    vendor: string
  ): Promise<ethers.ContractTransaction> {
    return this.functions.revokeVendor(tenderId, vendor);
  }

  async getTender(tenderId: number): Promise<Tender> {
    const result = await this.functions.getTender(tenderId);
    return {
      id: tenderId,
      title: result[0],
      description: result[1],
      deadline: result[2],
      minBid: result[3],
      ownerAddress: result[4],
      status: result[5],
      winningBidId: result[6],
      createdAt: result[7],
      documentHash: result[8],
      isPrivate: result[9],
      allowedBidders: result[10],
    };
  }

  async getAllTenders(
    offset: number,
    limit: number
  ): Promise<{
    ids: number[];
    titles: string[];
    owners: string[];
    statuses: number[];
    deadlines: number[];
    minBids: ethers.BigNumber[];
    totalBids: number[];
  }> {
    const result = await this.functions.getAllTenders(offset, limit);
    return {
      ids: result[0],
      titles: result[1],
      owners: result[2],
      statuses: result[3],
      deadlines: result[4],
      minBids: result[5],
      totalBids: result[6],
    };
  }

  async getTenderBids(
    tenderId: number,
    offset: number,
    limit: number
  ): Promise<{
    ids: number[];
    bidders: string[];
    amounts: ethers.BigNumber[];
    timestamps: number[];
    proposals: string[];
  }> {
    const result = await this.functions.getTenderBids(tenderId, offset, limit);
    return {
      ids: result[0],
      bidders: result[1],
      amounts: result[2],
      timestamps: result[3],
      proposals: result[4],
    };
  }

  async getTenderCount(): Promise<number> {
    return this.functions.getTenderCount();
  }

  async getTenderBidsCount(tenderId: number): Promise<number> {
    return this.functions.getTenderBidsCount(tenderId);
  }

  async getApprovedVendors(tenderId: number): Promise<string[]> {
    return this.functions.getApprovedVendors(tenderId);
  }
} 