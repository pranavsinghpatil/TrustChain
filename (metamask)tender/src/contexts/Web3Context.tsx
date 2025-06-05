import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ethers, BigNumber, Contract, providers, Signer } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import type { FC, ReactNode } from 'react';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (accounts: string[]) => void) => void;
      removeListener: (eventName: string, handler: (accounts: string[]) => void) => void;
      removeAllListeners: (eventName: string) => void;
    };
  }
}

// Contract ABIs
export const TENDER_CONTRACT_ABI = [
  // Events
  'event TenderCreated(uint256 indexed id, address indexed creator, string title, uint256 deadline)',
  'event TenderUpdated(uint256 indexed id, string title, string description, uint256 budget, uint256 deadline)',
  'event TenderClosed(uint256 indexed id)',
  'event TenderAwarded(uint256 indexed id, address indexed winner)',
  'event TenderDisputed(uint256 indexed id, address indexed reporter, string reason)',
  'event BidPlaced(uint256 indexed tenderId, uint256 indexed bidId, address indexed bidder, uint256 amount)',
  'event BidUpdated(uint256 indexed tenderId, uint256 indexed bidId, uint256 amount)',
  'event BidWithdrawn(uint256 indexed tenderId, uint256 indexed bidId)',
  'event BidAwarded(uint256 indexed tenderId, uint256 indexed bidId)',
  'event BidRejected(uint256 indexed tenderId, uint256 indexed bidId)',
  
  // Functions
  'function tenderCount() view returns (uint256)',
  'function tenders(uint256) view returns (uint256 id, address creator, string title, string description, uint256 budget, uint256 deadline, uint256 createdAt, uint256 startDate, uint256 endDate, string status, uint256 bidCount, bool isActive, address winner)',
  'function createTender(string title, string description, uint256 budget, uint256 deadline, uint256 startDate, uint256 endDate, string department, string category, string location, string[] criteria, string notes) returns (uint256)',
  'function updateTender(uint256 id, string title, string description, uint256 budget, uint256 deadline, uint256 startDate, uint256 endDate, string department, string category, string location, string[] criteria, string notes) returns (bool)',
  'function closeTender(uint256 id) returns (bool)',
  'function awardTender(uint256 tenderId, uint256 bidId) returns (bool)',
  'function disputeTender(uint256 id, string reason) returns (bool)',
  'function deleteTender(uint256 id) returns (bool)',
  'function createBid(uint256 tenderId, uint256 amount, string description) returns (uint256)',
  'function updateBid(uint256 tenderId, uint256 bidId, uint256 amount, string description) returns (bool)',
  'function withdrawBid(uint256 tenderId, uint256 bidId) returns (bool)',
  'function getBidsForTender(uint256 tenderId) view returns (uint256[] memory)'
];

export const OFFICER_CONTRACT_ABI = [
  // Events
  'event OfficerAdded(address indexed officer, string name, string email)',
  'event OfficerUpdated(address indexed officer, string name, string email, bool isActive)',
  'event OfficerRemoved(address indexed officer)',
  
  // Functions
  'function isOfficer(address account) view returns (bool)',
  'function officers(address) view returns (string name, string email, bool isActive, uint256 createdAt, uint256 updatedAt)',
  'function addOfficer(address walletAddress, string name, string email) returns (bool)',
  'function updateOfficer(address walletAddress, string name, string email, bool isActive) returns (bool)',
  'function removeOfficer(address walletAddress) returns (bool)',
  'function getOfficers() view returns (address[] memory)'
];

export const USER_AUTH_ABI = [
  // Events
  'event UserRegistered(address indexed user, string name, string email)',
  'event UserUpdated(address indexed user, string name, string email)',
  
  // Functions
  'function registerUser(string name, string email) returns (bool)',
  'function updateUser(string name, string email) returns (bool)',
  'function users(address) view returns (string name, string email, uint256 createdAt)'
];

// Contract Addresses - Using actual hardhat test network addresses
export const CONTRACT_ADDRESSES = {
  TENDER_MANAGEMENT: process.env.NEXT_PUBLIC_TENDER_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  OFFICER_MANAGEMENT: process.env.NEXT_PUBLIC_OFFICER_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  USER_AUTH: process.env.NEXT_PUBLIC_USER_AUTH_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

// Flag to force development mode (set to false to use real blockchain interactions)
const FORCE_DEV_MODE = false;

// Network configuration
const REQUIRED_CHAIN_ID = 31337; // Hardhat local network
const NETWORK_CONFIG = {
  chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`, // '0x7A69' for Hardhat
  chainName: 'Hardhat Local Network',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['http://localhost:8545'],
  blockExplorerUrls: []
};

// Local storage keys
const TENDERS_STORAGE_KEY = 'local_tenders';
const OFFICERS_STORAGE_KEY = 'local_officers';
const BIDS_STORAGE_KEY = 'local_bids';

// Helper functions for local storage
const getLocalTenders = (): FormattedTender[] => {
  try {
    const tenders = localStorage.getItem(TENDERS_STORAGE_KEY);
    return tenders ? JSON.parse(tenders) : [];
  } catch (error) {
    console.error('Error getting tenders from local storage:', error);
    return [];
  }
};

const saveLocalTenders = (tenders: FormattedTender[]) => {
  try {
    localStorage.setItem(TENDERS_STORAGE_KEY, JSON.stringify(tenders));
  } catch (error) {
    console.error('Error saving tenders to local storage:', error);
  }
};

const getLocalOfficers = (): Officer[] => {
  try {
    const officers = localStorage.getItem(OFFICERS_STORAGE_KEY);
    return officers ? JSON.parse(officers) : [];
  } catch (error) {
    console.error('Error getting officers from local storage:', error);
    return [];
  }
};

const saveLocalOfficers = (officers: Officer[]) => {
  try {
    localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(officers));
  } catch (error) {
    console.error('Error saving officers to local storage:', error);
  }
};

const getLocalBids = (): Record<string, Bid[]> => {
  try {
    const bids = localStorage.getItem(BIDS_STORAGE_KEY);
    return bids ? JSON.parse(bids) : {};
  } catch (error) {
    console.error('Error getting bids from local storage:', error);
    return {};
  }
};

const saveLocalBids = (bids: Record<string, Bid[]>) => {
  try {
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids));
  } catch (error) {
    console.error('Error saving bids to local storage:', error);
  }
};

// Network Configuration
export const TARGET_NETWORK = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10),
  name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'Mainnet',
};

// Types
export type TenderStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'evaluation' | 'awarded';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// Interfaces
export interface Document {
  name: string;
  size: string;
  cid: string;
  url: string;
  type: string;
}

export interface Bid {
  id: string;
  bidder: string;
  amount: string;
  description: string;
  status: BidStatus;
  createdAt: number;
}

export interface OfficerPermissions {
  canCreate: boolean;
  canApprove: boolean;
  isActive?: boolean;
}

export interface Officer {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  walletAddress: string;
  username: string;
  updatedAt: number;
  permissions: OfficerPermissions;
  createdAt: number;
  position?: string;
  department?: string;
}

export interface TenderInput {
  title: string;
  description: string;
  budget: string;
  deadline: number;
  startDate: number;
  endDate: number;
  department: string;
  category: string;
  location: string;
  criteria: string[];
  documents: Document[];
  notes: string;
}

export interface TenderBase {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: number;
  createdAt: number;
  startDate: number;
  endDate: number;
  creator: string;
  createdBy: string;
  status: TenderStatus;
  department: string;
  category: string;
  location: string;
  bidCount: number;
  criteria: string[];
  documents: Document[];
  notes: string;
  bids: Bid[];
  isActive: boolean;
  winner: string;
}

export interface FormattedTender extends TenderBase {
  formattedBudget: string;
  formattedDeadline: string;
  formattedCreatedAt: string;
  formattedStartDate: string;
  formattedEndDate: string;
}

export type Tender = FormattedTender;

export interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  networkName: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  provider: providers.Web3Provider | null;
  signer: Signer | null;
  tenderContract: Contract | null;
  officerContract: Contract | null;
  userAuthContract: Contract | null;
  tenders: FormattedTender[];
  officers: Officer[];
  currentTender: FormattedTender | null;
  currentOfficer: Officer | null;
  isOfficer: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: () => Promise<boolean>;
  fetchTenders: () => Promise<FormattedTender[]>;
  fetchTenderById: (id: string) => Promise<FormattedTender | null>;
  createTender: (tender: Omit<TenderBase, 'id' | 'createdAt' | 'status' | 'bidCount' | 'bids' | 'isActive' | 'winner'>) => Promise<string>;
  updateTender: (id: string, updates: Partial<TenderBase>) => Promise<boolean>;
  closeTender: (tenderId: string) => Promise<boolean>;
  awardTender: (tenderId: string, bidId: string) => Promise<boolean>;
  disputeTender: (tenderId: string) => Promise<boolean>;
  deleteTender: (tenderId: string) => Promise<boolean>;
  createBid: (tenderId: string, amount: string, description: string) => Promise<boolean>;
  updateBid: (tenderId: string, bidId: string, updates: { amount?: string; description?: string }) => Promise<boolean>;
  withdrawBid: (tenderId: string, bidId: string) => Promise<boolean>;
  fetchBidsForTender: (tenderId: string) => Promise<Bid[]>;
  addOfficer: (walletAddress: string, name: string, email: string) => Promise<boolean>;
  updateOfficer: (walletAddress: string, updates: { name?: string; email?: string; isActive?: boolean }) => Promise<boolean>;
  removeOfficer: (walletAddress: string) => Promise<boolean>;
  fetchOfficer: (walletAddress: string) => Promise<Officer | null>;
  fetchAllOfficers: () => Promise<Officer[]>;
  formatDate: (date: Date | number | BigNumber) => string;
  parseBigNumber: (value: BigNumber) => string;
  parseTimestamp: (timestamp: BigNumber) => Date;
}

// Create the context with default values
const Web3Context = createContext<Web3ContextType | null>(null);

// Custom hook to use the Web3 context
export const useWeb3Context = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  return context;
};

// Main provider component
export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [provider, setProvider] = useState<providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [tenderContract, setTenderContract] = useState<Contract | null>(null);
  const [officerContract, setOfficerContract] = useState<Contract | null>(null);
  const [userAuthContract, setUserAuthContract] = useState<Contract | null>(null);
  const [tenders, setTenders] = useState<FormattedTender[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [currentTender, setCurrentTender] = useState<FormattedTender | null>(null);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [isOfficerState, setIsOfficerState] = useState<boolean>(false);
  const { toast } = useToast();

  const formatDate = useCallback((date: Date | number | BigNumber): string => {
    const timestamp = date instanceof BigNumber
      ? date.toNumber()
      : date instanceof Date
        ? Math.floor(date.getTime() / 1000)
        : Math.floor((new Date(date)).getTime() / 1000);
    return new Date(timestamp * 1000).toISOString();
  }, []);

  const parseBigNumber = useCallback((value: BigNumber): string => {
    return value.toString();
  }, []);

  const parseTimestamp = useCallback((timestamp: BigNumber): Date => {
    return new Date(timestamp.toNumber() * 1000);
  }, []);

  const formatTender = useCallback((tenderData: any): FormattedTender | null => {
    if (!tenderData) return null;
    const now = Math.floor(Date.now() / 1000);
    const deadline = typeof tenderData.deadline?.toNumber === 'function' 
      ? tenderData.deadline.toNumber() 
      : typeof tenderData.deadline === 'number' 
        ? tenderData.deadline 
        : now + 86400;
    
    return {
      ...tenderData,
      id: tenderData.id?.toString() || '',
      budget: tenderData.budget?.toString() || '0',
      deadline: deadline,
      createdAt: typeof tenderData.createdAt?.toNumber === 'function' ? tenderData.createdAt.toNumber() : now,
      startDate: typeof tenderData.startDate?.toNumber === 'function' ? tenderData.startDate.toNumber() : now,
      endDate: typeof tenderData.endDate?.toNumber === 'function' ? tenderData.endDate.toNumber() : now + 86400 * 30,
      creator: tenderData.creator || '',
      createdBy: tenderData.createdBy || '',
      status: tenderData.status || 'draft',
      department: tenderData.department || '',
      category: tenderData.category || '',
      location: tenderData.location || '',
      bidCount: typeof tenderData.bidCount?.toNumber === 'function' ? tenderData.bidCount.toNumber() : 0,
      criteria: Array.isArray(tenderData.criteria) ? tenderData.criteria : [],
      documents: Array.isArray(tenderData.documents) ? tenderData.documents.map((doc: any) => ({
        name: doc.name || '',
        size: doc.size?.toString() || '0',
        cid: doc.cid || '',
        url: doc.url || '',
        type: doc.type || 'application/octet-stream'
      })) : [],
      notes: tenderData.notes || '',
      bids: Array.isArray(tenderData.bids) ? tenderData.bids.map((bid: any) => ({
        id: bid.id?.toString() || '',
        bidder: bid.bidder || '',
        amount: bid.amount?.toString() || '0',
        description: bid.description || '',
        createdAt: bid.createdAt?.toNumber() || now,
        status: bid.status || 'pending'
      })) : [],
      isActive: typeof tenderData.isActive === 'boolean' ? tenderData.isActive : true,
      winner: tenderData.winner || '',
      formattedBudget: ethers.utils.formatEther(tenderData.budget?.toString() || '0'),
      formattedDeadline: new Date(deadline * 1000).toLocaleString(),
      formattedCreatedAt: new Date(
        (typeof tenderData.createdAt?.toNumber === 'function' 
          ? tenderData.createdAt.toNumber() 
          : now) * 1000
      ).toLocaleString(),
      formattedStartDate: new Date(
        (typeof tenderData.startDate?.toNumber === 'function' 
          ? tenderData.startDate.toNumber() 
          : now) * 1000
      ).toLocaleString(),
      formattedEndDate: new Date(
        (typeof tenderData.endDate?.toNumber === 'function' 
          ? tenderData.endDate.toNumber() 
          : now + 86400 * 30) * 1000
      ).toLocaleString(),
    };
  }, []);

  const fetchOfficer = useCallback(async (walletAddress: string): Promise<Officer | null> => {
    if (!officerContract) return null;
    try {
      const officer = await officerContract.getOfficer(walletAddress);
      return {
        id: walletAddress,
        name: officer.name,
        email: officer.email,
        isActive: officer.isActive,
        walletAddress,
        username: officer.username,
        updatedAt: officer.updatedAt?.toNumber() || Math.floor(Date.now() / 1000),
        permissions: {
          canCreate: officer.permissions?.canCreate || false,
          canApprove: officer.permissions?.canApprove || false,
        },
        createdAt: officer.createdAt?.toNumber() || Math.floor(Date.now() / 1000)
      };
    } catch (err) {
      console.error('Error fetching officer:', err);
      return null;
    }
  }, [officerContract]);

  const checkIfOfficer = useCallback(async (address: string): Promise<boolean> => {
    if (!officerContract) return false;
    try {
      return await officerContract.isOfficer(address);
    } catch (err) {
      console.error('Error checking officer status:', err);
      return false;
    }
  }, [officerContract]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask not detected',
        description: 'Please install MetaMask to connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Always show MetaMask popup to request account access
      // This creates a realistic flow even in development mode
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        toast({
          title: 'No accounts found',
          description: 'Please create an account in MetaMask',
          variant: 'destructive',
        });
        return false;
      }
      
      // Show success toast when wallet is connected
      toast({
        title: 'Wallet Connected',
        description: `Connected to account ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
      });

      // Get chain ID from ethereum provider
      let chainIdHex = '0x1'; // Default to mainnet
      try {
        // Safely access chainId property
        chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('[connectWallet] Current chain ID:', chainIdHex, 'Required:', `0x${REQUIRED_CHAIN_ID.toString(16)}`);
        
        // Check if we're on the correct network
        const currentChainId = parseInt(chainIdHex, 16);
        setIsCorrectNetwork(currentChainId === REQUIRED_CHAIN_ID);
        
        if (currentChainId !== REQUIRED_CHAIN_ID) {
          console.log('[connectWallet] Wrong network detected. Current:', currentChainId, 'Required:', REQUIRED_CHAIN_ID);
          toast({
            title: 'Wrong Network',
            description: `Please switch to Hardhat network (Chain ID: ${REQUIRED_CHAIN_ID})`,
            variant: 'destructive',
          });
        }
      } catch (chainError) {
        console.warn('Error getting chain ID:', chainError);
      }
      
      // Create provider with ENS disabled to prevent errors
      const web3Provider = new providers.Web3Provider(window.ethereum, {
        name: 'Hardhat-Network',
        chainId: REQUIRED_CHAIN_ID
      });
      
      const signer = web3Provider.getSigner();
      const chainId = parseInt(chainIdHex, 16);

      setAccount(accounts[0]);
      setIsConnected(true);
      setChainId(chainId);
      setNetworkName('custom-network');
      setIsCorrectNetwork(chainId === TARGET_NETWORK.chainId);
      setProvider(web3Provider);
      setSigner(signer);

      // Initialize contracts with real addresses if not in development mode
      let tenderContractInstance = null;
      let officerContractInstance = null;
      let userAuthContractInstance = null;
      
      // Check if we're in development mode
      const isDev = FORCE_DEV_MODE || false; // Set to false to always use blockchain
      
      if (!isDev) {
        // Only try to connect to real contracts if not in development mode
        try {
          tenderContractInstance = new Contract(
            CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
            TENDER_CONTRACT_ABI,
            signer
          );

          officerContractInstance = new Contract(
            CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
            OFFICER_CONTRACT_ABI,
            signer
          );

          userAuthContractInstance = new Contract(
            CONTRACT_ADDRESSES.USER_AUTH,
            USER_AUTH_ABI,
            signer
          );
        } catch (contractError) {
          console.error('Error initializing contracts:', contractError);
        }
      }

      setTenderContract(tenderContractInstance);
      setOfficerContract(officerContractInstance);
      setUserAuthContract(userAuthContractInstance);

      // Check if connected account is an officer
      try {
        if (officerContractInstance) {
          const isOfficer = await officerContractInstance.isOfficer(accounts[0]);
          setIsOfficerState(isOfficer);
        }
      } catch (officerErr) {
        console.warn('Error checking officer status:', officerErr);
        setIsOfficerState(false);
      }

      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
      return false;
    }
  }, [toast]);

  const disconnectWallet = useCallback(async () => {
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setTenderContract(null);
    setOfficerContract(null);
    setUserAuthContract(null);
    setTenders([]);
    setOfficers([]);
    setCurrentTender(null);
    setCurrentOfficer(null);
    setIsOfficerState(false);
  }, []);

  // Network switching function
  const switchNetwork = useCallback(async (): Promise<boolean> => {
    console.log('[switchNetwork] Attempting to switch to Hardhat network');
    if (!window.ethereum) {
      console.error('[switchNetwork] No ethereum provider found');
      toast({
        title: 'No Ethereum Provider',
        description: 'MetaMask not detected. Please install MetaMask extension.',
        variant: 'destructive',
      });
      return false;
    }
    
    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
      });
      
      console.log('[switchNetwork] Successfully switched to Hardhat network');
      setIsCorrectNetwork(true);
      
      toast({
        title: 'Network Switched',
        description: 'Successfully connected to Hardhat network',
      });
      
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || 
          (switchError.message && switchError.message.includes('Unrecognized chain ID'))) {
        console.log('[switchNetwork] Network not found, attempting to add it');
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
          
          // Check if the switch was successful
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          const success = currentChainId === REQUIRED_CHAIN_ID;
          
          setIsCorrectNetwork(success);
          
          if (success) {
            console.log('[switchNetwork] Successfully added and switched to Hardhat network');
            toast({
              title: 'Network Added',
              description: 'Successfully connected to Hardhat network',
            });
            return true;
          } else {
            console.error('[switchNetwork] Failed to switch to Hardhat network after adding');
            toast({
              title: 'Network Switch Failed',
              description: 'Please manually switch to Hardhat network in MetaMask',
              variant: 'destructive',
            });
            return false;
          }
        } catch (addError) {
          console.error('[switchNetwork] Error adding network:', addError);
          toast({
            title: 'Network Add Failed',
            description: 'Failed to add Hardhat network to MetaMask',
            variant: 'destructive',
          });
          return false;
        }
      } else {
        console.error('[switchNetwork] Error switching network:', switchError);
        toast({
          title: 'Network Switch Failed',
          description: 'Failed to switch to Hardhat network',
          variant: 'destructive',
        });
        return false;
      }
    }
  }, [toast]);
  
  // Fetch all officers from the blockchain
  const fetchAllOfficers = useCallback(async (): Promise<Officer[]> => {
    try {
      if (!officerContract) {
        console.error('[fetchAllOfficers] Officer contract not initialized');
        return [];
      }

      console.log('[fetchAllOfficers] Fetching officers from blockchain...');
      const officerCount = await officerContract.getOfficerCount();
      const officers: Officer[] = [];

      for (let i = 0; i < officerCount.toNumber(); i++) {
        const officer = await officerContract.getOfficerAtIndex(i);
        if (officer && officer.walletAddress !== ethers.constants.AddressZero) {
          officers.push({
            id: i.toString(),
            walletAddress: officer.walletAddress,
            name: officer.name,
            email: officer.email,
            isActive: officer.isActive
          });
        }
      }

      console.log(`[fetchAllOfficers] Found ${officers.length} officers`);
      return officers;
    } catch (error) {
      console.error('[fetchAllOfficers] Error fetching officers:', error);
      return [];
    }
  }, [officerContract]);

  // Define the addOfficer function
  const addOfficer = useCallback(async (walletAddress: string, name: string, email: string): Promise<boolean> => {
    // Force development mode to false to always use blockchain in production
    const isDev = false;
    
    if (isDev) {
      try {
        console.log('[addOfficer] Running in development mode, using local storage');
        
        // Create a new officer object
        const newOfficer: Officer = {
          id: walletAddress,
          name,
          email,
          isActive: true,
          walletAddress,
          username: email.split('@')[0] || 'user',
          updatedAt: Math.floor(Date.now() / 1000),
          permissions: {
            canCreate: true,
            canApprove: true,
          },
          createdAt: Math.floor(Date.now() / 1000),
        };

        // Get existing officers from local storage
        const localOfficers = getLocalOfficers();

        // Check if officer already exists
        const existingOfficerIndex = localOfficers.findIndex((o) =>
          o.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );

        if (existingOfficerIndex >= 0) {
          // Update existing officer
          localOfficers[existingOfficerIndex] = {
            ...localOfficers[existingOfficerIndex],
            name,
            email,
            updatedAt: Math.floor(Date.now() / 1000),
          };
          console.log('[addOfficer] Updated existing officer in local storage');
        } else {
          // Add new officer
          localOfficers.push(newOfficer);
          console.log('[addOfficer] Added new officer to local storage');
        }

        // Save to local storage
        saveLocalOfficers(localOfficers);
        setOfficers(localOfficers);

        // Show success toast
        toast({
          title: 'Officer Added',
          description: `${name} has been added as an officer (Development Mode)`,
        });

        return true;
      } catch (err: any) {
        console.error('[addOfficer] Error adding officer to local storage:', err);

        // Show error toast
        toast({
          title: 'Error Adding Officer',
          description: `Failed to add officer: ${err.message || 'Unknown error'}`,
          variant: 'destructive',
        });

        return false;
      }
    } else if (officerContract && signer) {
      console.log('[addOfficer] Running in production mode, using blockchain');
      try {
        // Ensure we have a connected wallet
        if (!isConnected) {
          console.log('[addOfficer] No wallet connected, attempting to connect');
          const connected = await connectWallet();
          if (!connected) {
            toast({
              title: 'Wallet Connection Required',
              description: 'Please connect your wallet to add an officer',
              variant: 'destructive',
            });
            throw new Error('Wallet connection required to add an officer');
          }
        }

        // Check if we're on the correct network
        if (!isCorrectNetwork) {
          console.log('[addOfficer] Wrong network, attempting to switch');
          const switched = await switchNetwork();
          if (!switched) {
            toast({
              title: 'Network Switch Required',
              description: 'Please switch to the Hardhat network to add an officer',
              variant: 'destructive',
            });
            throw new Error('Please switch to the correct network to add an officer');
          }
        }

        // Show pending toast
        toast({
          title: 'Transaction Pending',
          description: 'Adding officer to blockchain, please wait for confirmation...',
        });

        // Execute the contract transaction
        console.log('[addOfficer] Sending transaction to blockchain...');
        const tx = await officerContract.addOfficer(walletAddress, name, email);
        console.log('[addOfficer] Transaction sent:', tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('[addOfficer] Transaction confirmed:', receipt);

        // Show success toast
        toast({
          title: 'Officer Added',
          description: `${name} has been successfully added as an officer`,
        });

        // Refresh officers list
        await fetchAllOfficers();

        return true;
      } catch (err: any) {
        console.error('[addOfficer] Error adding officer to blockchain:', err);

        // Check if the error is "officer already exists"
        const errorMessage = err.message || '';
        if (
          errorMessage.includes('Officer already exists') ||
          errorMessage.includes('already registered') ||
          errorMessage.includes('already an officer')
        ) {
          console.log('[addOfficer] Officer already exists, treating as success');

          // Show info toast
          toast({
            title: 'Officer Already Exists',
            description: `${name} is already registered as an officer`,
          });

          return true;
        }

        // Show error toast
        toast({
          title: 'Error Adding Officer',
          description: `Failed to add officer: ${errorMessage || 'Unknown error'}`,
          variant: 'destructive',
        });

        return false;
      }
    } else {
      console.error('[addOfficer] No contract available or signer not initialized');

      // Show error toast
      toast({
        title: 'Error Adding Officer',
        description: 'Blockchain connection not available. Please connect your wallet.',
        variant: 'destructive',
      });

      return false;
    }
  }, [isConnected, isCorrectNetwork, officerContract, signer, toast, connectWallet, switchNetwork, fetchAllOfficers]);
  
  // Create context value with all the required methods and state
  // Define the fetchTenders function outside of the context value to avoid reference issues
  const fetchTendersImpl = useCallback(async () => {
    try {
      // Check if we're in development mode
      const isDev = FORCE_DEV_MODE || false; // Set to false to always use blockchain
      
      if (isDev) {
        // Use local storage for development mode
        const localTenders = getLocalTenders();
        setTenders(localTenders);
        return localTenders;
      } else if (tenderContract) {
        // For production with real contracts
        const tenderCount = await tenderContract.tenderCount();
        const tenders = [];
        for (let i = 1; i <= tenderCount; i++) {
          const tender = await tenderContract.tenders(i);
          if (tender.id.toString() !== '0') {
            tenders.push(formatTender(tender));
          }
        }
        const formattedTenders = tenders.filter((t): t is FormattedTender => t !== null);
        setTenders(formattedTenders);
        return formattedTenders;
      }
      return [];
    } catch (err) {
      console.error('Error fetching tenders:', err);
      // Return empty array on error
      return [];
    }
  }, [FORCE_DEV_MODE, tenderContract, formatTender, setTenders]);

  const contextValue = useMemo(() => ({
    account,
    isConnected,
    isLoading,
    error,
    networkName,
    chainId,
    isCorrectNetwork,
    provider,
    signer,
    tenderContract,
    officerContract,
    userAuthContract,
    tenders,
    officers,
    currentTender,
    currentOfficer,
    isOfficer: isOfficerState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    fetchTenders: fetchTendersImpl,
    addOfficer,
    
    // Add the missing createNewTender function
    createNewTender: async (tenderData: Omit<TenderBase, 'id' | 'createdAt' | 'status' | 'bidCount' | 'bids' | 'isActive' | 'winner'>) => {
      try {
        // Check if we're in development mode
        const isDev = FORCE_DEV_MODE || false; // Set to false to always use blockchain
        
        if (isDev) {
          // Use local storage for development mode
          const localTenders = getLocalTenders();
          
          // Create a new tender with a unique ID
          const newTender: FormattedTender = {
            ...tenderData,
            id: Date.now().toString(),
            createdAt: Date.now(),
            status: 'open' as TenderStatus, // Cast to TenderStatus
            bidCount: 0,
            bids: [],
            isActive: true,
            winner: '',
            creator: account || '',
            createdBy: account || '',
            formattedBudget: `${parseFloat(tenderData.budget).toLocaleString()} ETH`,
            formattedDeadline: new Date(tenderData.deadline).toLocaleDateString(),
            formattedCreatedAt: new Date().toLocaleDateString(),
            formattedStartDate: new Date(tenderData.startDate).toLocaleDateString(),
            formattedEndDate: new Date(tenderData.deadline).toLocaleDateString()
          };
          
          // Add to local storage
          localTenders.push(newTender);
          saveLocalTenders(localTenders);
          setTenders(localTenders);
          
          return newTender.id;
        } else if (tenderContract) {
          // For production with real contracts
          const tx = await tenderContract.createTender(
            tenderData.title,
            tenderData.description,
            ethers.utils.parseEther(tenderData.budget),
            Math.floor(tenderData.deadline / 1000),
            Math.floor(tenderData.startDate / 1000),
            Math.floor(tenderData.endDate / 1000),
            tenderData.department,
            tenderData.category,
            tenderData.location,
            tenderData.criteria,
            tenderData.notes
          );
          
          const receipt = await tx.wait();
          const event = receipt.events?.find(e => e.event === 'TenderCreated');
          const tenderId = event?.args?.id.toString() || '';
          
          // Refresh tenders list after creating a tender
          await fetchTendersImpl();
          
          return tenderId;
        }
        
        throw new Error('No contract available');
      } catch (err) {
        console.error('Error creating tender:', err);
        throw err;
      }
    },
    // Fetch a tender by its ID (string from URL). Handles string/number conversion and robust error checking.
    fetchTenderById: async (id: string) => {
      if (!tenderContract) {
        console.warn('[fetchTenderById] Tender contract not initialized');
        return null;
      }
      try {
        // Convert string ID to number if possible (for numeric contract index)
        let contractId: any = id;
        if (/^\d+$/.test(id)) {
          contractId = Number(id);
        } else if (id.startsWith('tender-')) {
          // If your IDs are custom (e.g., 'tender-123456'), extract the numeric part
          const match = id.match(/tender-(\d+)/);
          if (match && match[1]) {
            contractId = Number(match[1]);
          } else {
            console.warn(`[fetchTenderById] Invalid tender ID format: ${id}`);
            return null;
          }
        }
        // Fetch from contract
        const tender = await tenderContract.getTender(contractId);
        // Check if the returned tender is valid (id not zero/empty)
        if (!tender || (tender.id && tender.id.toString() === '0')) {
          console.warn(`[fetchTenderById] Tender not found for ID: ${id} (contract index: ${contractId})`);
          return null;
        }
        const formattedTender = formatTender(tender);
        setCurrentTender(formattedTender);
        return formattedTender;
      } catch (err) {
        console.error(`[fetchTenderById] Error fetching tender for ID ${id}:`, err);
        return null;
      }
    },
    createTender: async (tender) => {
      if (!tenderContract) return '';
      try {
        const tx = await tenderContract.createTender(
          tender.title,
          tender.description,
          ethers.utils.parseEther(tender.budget),
          tender.deadline,
          {
            value: ethers.utils.parseEther('0.01') // Example: 0.01 ETH deposit
          }
        );
        await tx.wait();
        return tx.hash;
      } catch (err) {
        console.error('Error creating tender:', err);
        return '';
      }
    },
    updateTender: async (id, updates) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.updateTender(
          id,
          updates.title || '',
          updates.description || '',
          updates.budget ? ethers.utils.parseEther(updates.budget) : 0,
          updates.deadline || 0
        );
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error updating tender:', err);
        return false;
      }
    },
    closeTender: async (tenderId) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.closeTender(tenderId);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error closing tender:', err);
        return false;
      }
    },
    awardTender: async (tenderId, bidId) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.awardTender(tenderId, bidId);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error awarding tender:', err);
        return false;
      }
    },
    disputeTender: async (tenderId) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.disputeTender(tenderId);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error disputing tender:', err);
        return false;
      }
    },
    deleteTender: async (tenderId) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.deleteTender(tenderId);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error deleting tender:', err);
        return false;
      }
    },
    createBid: async (tenderId, amount, description) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.createBid(
          tenderId,
          description,
          { value: ethers.utils.parseEther(amount) }
        );
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error creating bid:', err);
        return false;
      }
    },
    updateBid: async (tenderId, bidId, updates) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.updateBid(
          tenderId,
          bidId,
          updates.amount ? ethers.utils.parseEther(updates.amount) : 0,
          updates.description || ''
        );
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error updating bid:', err);
        return false;
      }
    },
    withdrawBid: async (tenderId, bidId) => {
      if (!tenderContract) return false;
      try {
        const tx = await tenderContract.withdrawBid(tenderId, bidId);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error withdrawing bid:', err);
        return false;
      }
    },
    fetchBidsForTender: async (tenderId: string) => {
      if (!tenderContract) return [];
      try {
        const bidIds = await tenderContract.getBidsForTender(tenderId);
        const bids = await Promise.all(
          bidIds.map(async (bidId: BigNumber) => {
            const bid = await tenderContract.getBid(bidId);
            return {
              id: bidId.toString(),
              bidder: bid.bidder,
              amount: bid.amount.toString(),
              description: bid.description,
              status: bid.status,
              createdAt: bid.createdAt.toNumber()
            };
          })
        );
        return bids;
      } catch (err) {
        console.error('Error fetching bids for tender:', err);
        return [];
      }
    },
    addOfficer: async (walletAddress: string, name: string, email: string) => {
      const { toast } = useToast();
      
      // Check if wallet is connected
      if (!isConnected) {
        const connected = await connectWallet();
        if (!connected) {
          toast({
            title: "Error",
            description: "Wallet connection required to add an officer",
            variant: "destructive"
          });
          throw new Error('Wallet connection required to add an officer');
        }
      }
      
      // Check if on correct network
      if (!isCorrectNetwork) {
        const switched = await switchNetwork();
        if (!switched) {
          toast({
            title: "Error",
            description: "Please switch to the correct network to add an officer",
            variant: "destructive"
          });
          throw new Error('Please switch to the correct network to add an officer');
        }
      }
      
      try {
        // Show pending toast
        toast({
          title: "Processing",
          description: "Adding officer to the blockchain...",
        });
        
        // Add officer to blockchain
        const tx = await officerContract.addOfficer(walletAddress, name, email);
        
        // Show waiting toast
        toast({
          title: "Waiting",
          description: "Waiting for transaction confirmation...",
        });
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Show success toast
        toast({
          title: "Success",
          description: "Officer added successfully!",
          variant: "default"
        });
        
        // Refresh officers list
        await fetchAllOfficers();
        
        return true;
      } catch (err: any) {
        console.error('Error adding officer:', err);
        
        // Check if officer already exists
        if (err.message && err.message.includes('Officer already exists')) {
          toast({
            title: "Error",
            description: "Officer with this wallet address already exists",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add officer: " + (err.message || 'Unknown error'),
            variant: "destructive"
          });
        }
        
        return false;
      }
    },
    fetchAllOfficers: async () => {
      if (!officerContract) return [];
      try {
        const officerAddresses = await officerContract.getAllOfficers();
        const officers = await Promise.all(
          officerAddresses.map(async (address: string) => {
            const officer = await officerContract.getOfficer(address);
            return {
              id: address,
              walletAddress: address,
              name: officer.name,
              email: officer.email,
              isActive: officer.isActive,
              username: officer.email.split('@')[0] || 'user',
              createdAt: officer.createdAt.toNumber(),
              updatedAt: officer.updatedAt.toNumber(),
              permissions: {
                canCreate: true,
                canApprove: true
              }
            };
          })
        );
        setOfficers(officers);
        return officers;
      } catch (err) {
        console.error('Error fetching officers:', err);
        return [];
      }
    },
  // Define the context value with all the functions and state
  const contextValue = useMemo(() => ({
    account,
    isConnected,
    isLoading,
    error,
    networkName,
    chainId,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    tenders,
    officers,
    fetchAllOfficers,
    addOfficer
  }), [
    account,
    isConnected,
    isLoading,
    error,
    networkName,
    chainId,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    tenders,
    officers,
    fetchAllOfficers,
    addOfficer
  ]);

  // Return the provider component
  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

  export default Web3Provider;

  useEffect(() => {
    const init = async () => {
      if (window.ethereum && account) {
        try {
          const web3Provider = new Web3Provider(window.ethereum);
          const signer = web3Provider.getSigner();

          let tenderContractInstance;
          let officerContractInstance;
          let userAuthContractInstance;

          // Check if we're in development mode (using placeholder addresses)
          const isDev = CONTRACT_ADDRESSES.TENDER_MANAGEMENT.includes('0x1234');

          if (isDev) {
            // Use local storage for development mode instead of mock contracts
            console.log('Using local storage for development mode');
            // We don't need to create contract instances in development mode
            // The functions will use local storage directly
          } else {
            // Use real contracts for production
            try {
              tenderContractInstance = new Contract(
                CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
                TENDER_CONTRACT_ABI,
                signer
              );

              officerContractInstance = new Contract(
                CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
                OFFICER_CONTRACT_ABI,
                signer
              );

              userAuthContractInstance = new Contract(
                CONTRACT_ADDRESSES.USER_AUTH,
                USER_AUTH_ABI,
                signer
              );
            } catch (error) {
              console.error('Error creating contract instances:', error);
            }
          }

          setProvider(web3Provider);
          setSigner(signer);
          setTenderContract(tenderContractInstance);
          setOfficerContract(officerContractInstance);
          setUserAuthContract(userAuthContractInstance);
          setIsLoading(false);

          // Check if connected account is an officer
          try {
            if (officerContractInstance) {
              const isOfficer = await officerContractInstance.isOfficer(account);
              setIsOfficerState(isOfficer);
            }
          } catch (officerErr) {
            console.warn('Error checking officer status:', officerErr);
            setIsOfficerState(false);
          }
        } catch (err) {
          console.error('Error initializing contracts:', err);
          setError('Failed to initialize contracts');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [account]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Export the context for advanced use cases
export { Web3Context };
