import { ethers } from 'ethers';

// Contract addresses - these would be updated after deployment
export const CONTRACT_ADDRESSES = {
  OFFICER_MANAGEMENT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  USER_AUTHENTICATION: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TENDER_MANAGEMENT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

// Import ABIs
import OfficerManagementABI from '../abis/OfficerManagement.json';
import UserAuthenticationABI from '../abis/UserAuthentication.json';
import TenderManagementABI from '../abis/TenderManagement.json';

// Officer Management Contract Interface
export interface IOfficerManagement {
  addOfficer: (
    walletAddress: string,
    id: string,
    name: string,
    username: string,
    email: string
  ) => Promise<ethers.ContractTransaction>;
  
  updateOfficer: (
    walletAddress: string,
    name: string,
    username: string,
    email: string
  ) => Promise<ethers.ContractTransaction>;
  
  removeOfficer: (
    walletAddress: string
  ) => Promise<ethers.ContractTransaction>;
  
  setOfficerStatus: (
    walletAddress: string,
    isActive: boolean
  ) => Promise<ethers.ContractTransaction>;
  
  getOfficer: (
    walletAddress: string
  ) => Promise<[string, string, string, string, boolean, ethers.BigNumber]>;
  
  isOfficer: (
    walletAddress: string
  ) => Promise<boolean>;
  
  getOfficerCount: () => Promise<ethers.BigNumber>;
  
  getAllOfficerAddresses: () => Promise<string[]>;
}

// User Authentication Contract Interface
export interface IUserAuthentication {
  registerUser: (
    walletAddress: string,
    id: string,
    name: string,
    username: string,
    email: string,
    role: string,
    companyDetails: [
      string, // companyName
      string, // registrationNumber
      string, // gstNumber
      string, // panNumber
      number, // establishmentYear
      string, // registeredAddress
      string, // state
      string, // city
      string, // pinCode
      string  // bidderType
    ]
  ) => Promise<ethers.ContractTransaction>;
  
  updateUser: (
    walletAddress: string,
    name: string,
    username: string,
    email: string
  ) => Promise<ethers.ContractTransaction>;
  
  updateCompanyDetails: (
    walletAddress: string,
    companyDetails: [
      string, // companyName
      string, // registrationNumber
      string, // gstNumber
      string, // panNumber
      number, // establishmentYear
      string, // registeredAddress
      string, // state
      string, // city
      string, // pinCode
      string  // bidderType
    ]
  ) => Promise<ethers.ContractTransaction>;
  
  setUserApproval: (
    walletAddress: string,
    isApproved: boolean,
    remark: string
  ) => Promise<ethers.ContractTransaction>;
  
  removeUser: (
    walletAddress: string
  ) => Promise<ethers.ContractTransaction>;
  
  getUserByAddress: (
    walletAddress: string
  ) => Promise<[string, string, string, string, string, boolean, string, ethers.BigNumber]>;
  
  getUserByUsername: (
    username: string
  ) => Promise<[string, string, string, string, string, boolean, string, ethers.BigNumber]>;
  
  getCompanyDetails: (
    walletAddress: string
  ) => Promise<[string, string, string, string, ethers.BigNumber, string, string, string, string, string]>;
  
  isUser: (
    walletAddress: string
  ) => Promise<boolean>;
  
  isAdmin: (
    walletAddress: string
  ) => Promise<boolean>;
  
  isOfficer: (
    walletAddress: string
  ) => Promise<boolean>;
  
  getUserCount: () => Promise<ethers.BigNumber>;
  
  getAllUserAddresses: () => Promise<string[]>;
}

// Tender Management Contract Interface
export interface ITenderManagement {
  createTender: (
    tenderId: string,
    title: string,
    description: string,
    estimatedValue: number,
    startDate: number,
    endDate: number,
    category: string,
    department: string,
    location: string,
    documents: string[]
  ) => Promise<ethers.ContractTransaction>;
  
  updateTender: (
    tenderId: string,
    title: string,
    description: string,
    estimatedValue: number,
    startDate: number,
    endDate: number,
    category: string,
    department: string,
    location: string,
    documents: string[]
  ) => Promise<ethers.ContractTransaction>;
  
  changeTenderStatus: (
    tenderId: string,
    status: number // 0: Draft, 1: Published, 2: Closed, 3: Awarded, 4: Cancelled
  ) => Promise<ethers.ContractTransaction>;
  
  submitBid: (
    bidId: string,
    tenderId: string,
    bidAmount: number,
    documents: string[]
  ) => Promise<ethers.ContractTransaction>;
  
  changeBidStatus: (
    bidId: string,
    status: number // 0: Submitted, 1: Shortlisted, 2: Rejected, 3: Awarded
  ) => Promise<ethers.ContractTransaction>;
  
  getTender: (
    tenderId: string
  ) => Promise<[string, string, string, ethers.BigNumber, ethers.BigNumber, ethers.BigNumber, string, number, ethers.BigNumber, string, string, string]>;
  
  getTenderDocuments: (
    tenderId: string
  ) => Promise<string[]>;
  
  getBid: (
    bidId: string
  ) => Promise<[string, string, string, ethers.BigNumber, ethers.BigNumber, number]>;
  
  getBidDocuments: (
    bidId: string
  ) => Promise<string[]>;
  
  getTenderBids: (
    tenderId: string
  ) => Promise<string[]>;
  
  getUserBids: (
    userAddress: string
  ) => Promise<string[]>;
  
  getTenderCount: () => Promise<ethers.BigNumber>;
  
  getAllTenderIds: () => Promise<string[]>;
}

// Contract factory functions
export const getOfficerManagementContract = (
  provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider,
  signer?: ethers.Signer
): IOfficerManagement => {
  const contractAddress = CONTRACT_ADDRESSES.OFFICER_MANAGEMENT;
  const contract = new ethers.Contract(
    contractAddress,
    OfficerManagementABI,
    signer || provider
  );
  return contract as unknown as IOfficerManagement;
};

export const getUserAuthenticationContract = (
  provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider,
  signer?: ethers.Signer
) => {
  const contractAddress = CONTRACT_ADDRESSES.USER_AUTHENTICATION;
  const contract = new ethers.Contract(
    contractAddress,
    UserAuthenticationABI,
    signer || provider
  );
  return contract as unknown as IUserAuthentication;
};

export const getTenderManagementContract = (
  provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider,
  signer?: ethers.Signer
) => {
  const contractAddress = CONTRACT_ADDRESSES.TENDER_MANAGEMENT;
  const contract = new ethers.Contract(
    contractAddress,
    TenderManagementABI,
    signer || provider
  );
  return contract as unknown as ITenderManagement;
};
