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

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  TENDER_MANAGEMENT: process.env.NEXT_PUBLIC_TENDER_CONTRACT_ADDRESS || '0x1234...',
  OFFICER_MANAGEMENT: process.env.NEXT_PUBLIC_OFFICER_CONTRACT_ADDRESS || '0x5678...',
  USER_AUTH: process.env.NEXT_PUBLIC_USER_AUTH_ADDRESS || '0x9abc...',
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
const Web3Context = createContext<Web3ContextType>({
  account: null,
  isConnected: false,
  isLoading: true,
  error: null,
  networkName: null,
  chainId: null,
  isCorrectNetwork: false,
  provider: null,
  signer: null,
  tenderContract: null,
  officerContract: null,
  userAuthContract: null,
  tenders: [],
  officers: [],
  currentTender: null,
  currentOfficer: null,
  isOfficer: false,
  connectWallet: async () => false,
  disconnectWallet: async () => {},
  switchNetwork: async () => false,
  fetchTenders: async () => [],
  fetchTenderById: async () => null,
  createTender: async () => '',
  updateTender: async () => false,
  closeTender: async () => false,
  awardTender: async () => false,
  disputeTender: async () => false,
  deleteTender: async () => false,
  createBid: async () => false,
  updateBid: async () => false,
  withdrawBid: async () => false,
  fetchBidsForTender: async () => [],
  addOfficer: async () => false,
  updateOfficer: async () => false,
  removeOfficer: async () => false,
  fetchOfficer: async () => null,
  fetchAllOfficers: async () => [],
  formatDate: () => '',
  parseBigNumber: (value: BigNumber) => value.toString(),
  parseTimestamp: (timestamp: BigNumber) => new Date(timestamp.toNumber() * 1000),
});

// Context hooks for accessing Web3 context
export const useWeb3Context = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  return context;
};

// Alias for backward compatibility - this is the hook imported by AuthContext
export const useWeb3 = useWeb3Context;

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
      } catch (chainError) {
        console.warn('Error getting chain ID:', chainError);
      }
      
      // Create provider with ENS disabled to prevent errors
      const web3Provider = new providers.Web3Provider(window.ethereum, {
        name: 'custom-network',
        chainId: parseInt(chainIdHex, 16)
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
      
      // Check if we're in development mode (using placeholder addresses)
      const isDev = CONTRACT_ADDRESSES.TENDER_MANAGEMENT.includes('0x1234');
      
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

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TARGET_NETWORK.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError) {
      console.error('Error switching network:', switchError);
      return false;
    }
  }, []);

  // Create context value with all the required methods and state
  // Define the fetchTenders function outside of the context value to avoid reference issues
  const fetchTendersImpl = async () => {
    try {
      // Check if we're in development mode
      const isDev = CONTRACT_ADDRESSES.TENDER_MANAGEMENT.includes('0x1234');
      
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
  };

  const contextValue = useMemo<Web3ContextType>(() => ({
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
    
    // Add the missing createNewTender function
    createNewTender: async (tenderData: Omit<TenderBase, 'id' | 'createdAt' | 'status' | 'bidCount' | 'bids' | 'isActive' | 'winner'>) => {
      try {
        // Check if we're in development mode
        const isDev = CONTRACT_ADDRESSES.TENDER_MANAGEMENT.includes('0x1234');
        
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
        console.error('Error fetching bids:', err);
        return [];
      }
    },
    addOfficer: async (walletAddress, name, email) => {
      if (!officerContract) return false;
      try {
        const tx = await officerContract.addOfficer(walletAddress, name, email);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error adding officer:', err);
        return false;
      }
    },
    updateOfficer: async (walletAddress, updates) => {
      if (!officerContract) return false;
      try {
        const tx = await officerContract.updateOfficer(
          walletAddress,
          updates.name || '',
          updates.email || '',
          updates.isActive ?? true
        );
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error updating officer:', err);
        return false;
      }
    },
    removeOfficer: async (walletAddress) => {
      if (!officerContract) return false;
      try {
        const tx = await officerContract.removeOfficer(walletAddress);
        await tx.wait();
        return true;
      } catch (err) {
        console.error('Error removing officer:', err);
        return false;
      }
    },
    fetchOfficer: async (walletAddress) => {
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
              name: officer.name,
              email: officer.email,
              isActive: officer.isActive,
              walletAddress: address,
              username: officer.username,
              updatedAt: officer.updatedAt?.toNumber() || Math.floor(Date.now() / 1000),
              permissions: {
                canCreate: officer.permissions?.canCreate || false,
                canApprove: officer.permissions?.canApprove || false,
              },
              createdAt: officer.createdAt?.toNumber() || Math.floor(Date.now() / 1000)
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
    formatDate,
    parseBigNumber,
    parseTimestamp
  }), [
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
    isOfficerState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    formatDate,
    parseBigNumber,
    parseTimestamp,
    formatTender
  ]);

  // Initialize contracts on mount
  useEffect(() => {
    const init = async () => {
      if (window.ethereum && account) {
        try {
          const web3Provider = new providers.Web3Provider(window.ethereum);
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
