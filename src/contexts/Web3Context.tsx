// @refresh reset
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback,
  useMemo
} from "react";
import { ethers } from 'ethers';
const { formatEther } = ethers.utils;
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "@/config/contracts";
import { TARGET_NETWORK } from "@/config/network";

// Types
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (accounts: string[]) => void) => void;
  removeListener: (eventName: string, handler: (accounts: string[]) => void) => void;
  removeAllListeners: (eventName: string) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface OfficerPermissions {
  canCreate: boolean;
  canApprove: boolean;
  isActive: boolean;
}

export interface Officer {
  id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  walletAddress: string;
  password?: string;
  permissions: OfficerPermissions;
  createdAt: Date;
}

export interface Tender {
  // Core properties
  id: string;
  title: string;
  description: string;
  // Financial properties
  budget?: string | ethers.BigNumber | number;
  budge?: string | ethers.BigNumber | number;
  budjet?: string | ethers.BigNumber | number;
  // Date properties
  deadline?: number | Date | ethers.BigNumber;
  createdAt: number | Date | ethers.BigNumber;
  startDate?: number | Date | ethers.BigNumber;
  endDate?: number | Date | ethers.BigNumber;
  createDate?: number | Date | ethers.BigNumber;
  // User-related properties
  creator?: string;
  createdBy?: string;
  creatr?: string;
  // Status and metadata
  status: number | 'open' | 'closed' | 'awarded' | 'disputed';
  department: string;
  category: string;
  location: string;
  // Bids and documents
  bidCount?: number | string | ethers.BigNumber;
  criteria: string[] | any[];
  documents: Array<{
    name: string;
    size: string;
    cid: string;
    hash?: string;
  }>;
  // Additional properties that might come from the contract
  [key: string]: any;
}

export interface FormattedTender {
  // Core properties
  id: string;
  title: string;
  description: string;
  
  // Financial properties
  budget: string;
  formattedBudget: string;
  
  // Date properties
  deadline: Date | number;
  createdAt: Date | number;
  startDate?: Date | number;
  endDate?: Date | number;
  
  // User-related properties
  creator?: string;
  createdBy?: string;
  
  // Status and metadata
  status: 'open' | 'closed' | 'awarded' | 'disputed';
  department: string;
  category: string;
  location: string;
  
  // Bids and documents
  bidCount?: number;
  criteria: string[];
  documents: Array<{
    name: string;
    size: string;
    cid: string;
  }>;
  
  // Formatted strings
  formattedDeadline: string;
  formattedCreatedAt: string;
  formattedStartDate?: string;
  formattedEndDate?: string;
  
  // Allow any additional properties
  [key: string]: any;
}

export interface Bid {
  id: string;
  tenderId: string | number;
  bidder: string;
  amount: string | number;
  timestamp: number;
  status: string;
  documents: { name: string; size: string }[];
  notes: string;
}

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<boolean>;
  officerContract: ethers.Contract | null;
  userAuthContract: ethers.Contract | null;
  tenderContract: ethers.Contract | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  addOfficer: (username: string, name: string, email: string) => Promise<boolean>;
  updateOfficer: (walletAddress: string, name: string, username: string, email: string) => Promise<boolean>;
  removeOfficer: (walletAddress: string) => Promise<boolean>;
  getOfficer: (walletAddress: string) => Promise<Officer | null>;
  getAllOfficers: () => Promise<Officer[]>;
  createNewTender: (data: { 
    title: string; 
    description: string; 
    department: string; 
    budget: string; 
    deadline: number; 
    criteria: string[]; 
    documents: { name: string; size: string }[] 
  }) => Promise<string>;
  fetchTenders: () => Promise<FormattedTender[]>;
  fetchTenderById: (id: number | string) => Promise<any>;
  fetchBidsForTender: (tenderId: number | string) => Promise<any[]>;
  closeTender: (tenderId: number | string) => Promise<boolean>;
  awardTender: (tenderId: number | string, bidId: string) => Promise<boolean>;
  disputeTender: (tenderId: number | string) => Promise<boolean>;
  deleteTender: (tenderId: string) => Promise<boolean>;
  contractAddress: string;
  networkName: string;
}

interface Web3ProviderProps {
  children: ReactNode;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  // State variables
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [officerContract, setOfficerContract] = useState<ethers.Contract | null>(null);
  const [userAuthContract, setUserAuthContract] = useState<ethers.Contract | null>(null);
  const [tenderContract, setTenderContract] = useState<ethers.Contract | null>(null);
  
  const { toast } = useToast();
  const isCorrectNetwork = useMemo(() => chainId === TARGET_NETWORK.chainId, [chainId]);

  // Load contracts
  const loadContracts = useCallback(async (provider: ethers.providers.Web3Provider, signer: ethers.Signer) => {
    try {
      const officerContract = new ethers.Contract(
        CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
        CONTRACT_ABI.OFFICER_MANAGEMENT,
        signer
      );

      const userAuthContract = new ethers.Contract(
        CONTRACT_ADDRESSES.USER_AUTHENTICATION,
        CONTRACT_ABI.USER_AUTHENTICATION,
        signer
      );

      const tenderContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        signer
      );

      setOfficerContract(officerContract);
      setUserAuthContract(userAuthContract);
      setTenderContract(tenderContract);
    } catch (error) {
      console.error('Error loading contracts:', error);
      throw error;
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 provider');
      }

      setIsLoading(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      // Update state
      setProvider(web3Provider);
      setSigner(signer);
      setChainId(network.chainId);
      setAccount(accounts[0]);
      setIsConnected(true);

      // Load contracts
      await loadContracts(web3Provider, signer);

      // Check network
      if (network.chainId !== TARGET_NETWORK.chainId) {
        toast({
          title: 'Wrong Network',
          description: `Please connect to ${TARGET_NETWORK.name || 'the correct network'}`,
          variant: 'destructive',
          duration: 5000,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadContracts, toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setAccount(null);
      setIsConnected(false);
      setChainId(null);
      setProvider(null);
      setSigner(null);
      setOfficerContract(null);
      setUserAuthContract(null);
      setTenderContract(null);
      setError(null);

      // Remove event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error('No Web3 provider found');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TARGET_NETWORK.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [TARGET_NETWORK],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw new Error('Failed to add network');
        }
      }
      console.error('Error switching network:', switchError);
      throw switchError;
    }
  }, []);

  // Event handlers
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnectWallet]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await web3Provider.getNetwork();
          const accounts = await web3Provider.listAccounts();
          
          if (accounts.length > 0) {
            const signer = web3Provider.getSigner();
            setProvider(web3Provider);
            setSigner(signer);
            setChainId(network.chainId);
            setAccount(accounts[0]);
            setIsConnected(true);
            await loadContracts(web3Provider, signer);
          }
        } catch (error) {
          console.error('Error initializing Web3:', error);
        }
      }
    };

    init();
  }, [loadContracts]);

  // Officer management functions
  const addOfficer = useCallback(async (username: string, name: string, email: string): Promise<boolean> => {
    if (!officerContract) throw new Error('Officer contract not initialized');
    const tx = await officerContract.addOfficer(username, name, email);
    await tx.wait();
    return true;
  }, [officerContract]);

  const updateOfficer = useCallback(async (walletAddress: string, name: string, username: string, email: string): Promise<boolean> => {
    if (!officerContract) throw new Error('Officer contract not initialized');
    const tx = await officerContract.updateOfficer(walletAddress, name, username, email);
    await tx.wait();
    return true;
  }, [officerContract]);

  const removeOfficer = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (!officerContract) throw new Error('Officer contract not initialized');
    const tx = await officerContract.removeOfficer(walletAddress);
    await tx.wait();
    return true;
  }, [officerContract]);

  const getOfficer = useCallback(async (walletAddress: string): Promise<Officer | null> => {
    if (!officerContract) throw new Error('Officer contract not initialized');
    return await officerContract.getOfficer(walletAddress);
  }, [officerContract]);

  const getAllOfficers = useCallback(async (): Promise<Officer[]> => {
    if (!officerContract) return [];
    const officers = await officerContract.getAllOfficers();
    return officers.map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt.toNumber() * 1000)
    }));
  }, [officerContract]);

  // Tender management functions
  const createNewTender = useCallback(async (data: {
    title: string;
    description: string;
    department: string;
    budget: string;
    startDate?: number; // Start date in milliseconds (optional, defaults to now)
    deadline: number; // End date in milliseconds
    criteria: string[];
    documents: { name: string; size: string }[];
    category?: string;
    location?: string;
  }): Promise<string> => {
    if (!tenderContract) throw new Error('Tender contract not initialized');
    
    try {
      // Generate a unique ID for the tender
      const tenderId = `tender-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Get current timestamp in seconds
      const now = Math.floor(Date.now() / 1000);
      
      // Calculate start and end timestamps in seconds
      const startTimestamp = data.startDate 
        ? Math.floor(data.startDate / 1000) 
        : now;
      
      const endTimestamp = Math.floor(data.deadline / 1000);
      
      // Validate dates
      if (startTimestamp >= endTimestamp) {
        throw new Error('Start date must be before end date');
      }
      
      // Ensure end date is in the future
      if (endTimestamp <= now) {
        throw new Error('End date must be in the future');
      }
      
      // Format documents array (ensure it's not empty)
      const documents = data.documents && data.documents.length > 0 
        ? data.documents.map(doc => doc.name)
        : [''];
      
      // Call the contract with all required parameters
      const tx = await tenderContract.createTender(
        tenderId,                           // id (string)
        data.title,                         // title (string)
        data.description,                   // description (string)
        ethers.utils.parseEther(data.budget), // estimatedValue (BigNumber)
        startTimestamp,                     // startDate (uint256)
        endTimestamp,                       // endDate (uint256)
        data.category || 'General',         // category (string)
        data.department,                    // department (string)
        data.location || '',                // location (string)
        documents                           // documents (string[])
      );
      
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error creating tender:', error);
      throw error;
    }
  }, [tenderContract]);

  // Helper function to convert hex to string
  const hexToString = (hex: string): string => {
    if (!hex || !hex.startsWith('0x')) return '';
    try {
      // Remove '0x' prefix and get the length of the string from the first 64 characters
      const strLen = parseInt(hex.slice(2, 66), 16);
      // Get the actual string data starting from position 66
      let str = '';
      for (let i = 0; i < strLen * 2; i += 2) {
        const charCode = parseInt(hex.slice(66 + i, 68 + i), 16);
        if (charCode) str += String.fromCharCode(charCode);
      }
      return str;
    } catch (e) {
      console.warn('Error converting hex to string:', e);
      return '';
    }
  };

  // Helper function to convert hex to address
  const hexToAddress = (hex: string): string => {
    if (!hex || hex.length < 42) return '';
    try {
      return ethers.utils.getAddress('0x' + hex.slice(hex.length - 40));
    } catch (e) {
      console.warn('Error converting hex to address:', e);
      return '';
    }
  };

  // Helper function to convert hex to BigNumber safely
  const hexToBigNumberString = (hex: string): string => {
    if (!hex || !hex.startsWith('0x')) return '0';
    try {
      return ethers.BigNumber.from(hex).toString();
    } catch (e) {
      console.warn('Error converting hex to BigNumber:', e);
      return '0';
    }
  };

  // Function to fetch a tender by ID from the contract
  const fetchTenderById = useCallback(async (id: number | string): Promise<FormattedTender | null> => {
    try {
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        return null;
      }
      
      const tenderId = typeof id === 'number' ? `tender-${id}` : id.toString();
      console.log(`Fetching tender by ID: ${tenderId}`);
      
      try {
        console.log(`Calling getTender(${tenderId}) on contract...`);
        const tender = await tenderContract.getTender(tenderId);
        
        if (!tender) {
          console.warn(`Tender ${tenderId} not found in contract`);
          return null;
        }
        
        console.log(`Raw tender data for ${tenderId}:`, tender);
        
        // Format the tender data using our helper functions
        const formattedTender: FormattedTender = {
          id: tenderId,
          title: tender.title?.toString() || `Tender ${tenderId.substring(0, 8)}`,
          description: tender.description?.toString() || 'No description available',
          budget: safeParseBigNumber(tender.budget, 0),
          deadline: safeParseTimestamp(tender.deadline).getTime() / 1000,
          creator: tender.creator?.toString() || account || '',
          status: (tender.status?.toString() || 'open') as 'open' | 'closed' | 'awarded' | 'disputed',
          createdAt: safeParseTimestamp(tender.createdAt),
          department: tender.department?.toString() || 'General',
          category: tender.category?.toString() || 'Procurement',
          location: tender.location?.toString() || 'Multiple Locations',
          bidCount: parseInt(safeParseBigNumber(tender.bidCount, 0)),
          criteria: Array.isArray(tender.criteria) 
            ? tender.criteria.map((c: any) => c.toString()) 
            : [],
          documents: Array.isArray(tender.documents)
            ? tender.documents.map((doc: any) => ({
                name: doc.name?.toString() || 'Document',
                size: doc.size?.toString() || '0 KB',
                cid: doc.cid?.toString() || ''
              }))
            : []
        };
        
        console.log(`Successfully formatted tender ${tenderId}:`, formattedTender);
        return formattedTender;
        
      } catch (err) {
        console.error(`Error fetching tender ${tenderId}:`, err);
        return null;
      }
    } catch (error) {
      console.error('Error fetching tender by ID:', error);
      return null;
    }
  }, [tenderContract, account]);

  // Helper function to convert status number to text
  const getStatusText = (status: number | string): 'open' | 'closed' | 'awarded' | 'disputed' => {
    const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
    switch (statusNum) {
      case 0: return 'open';
      case 1: return 'closed';
      case 2: return 'awarded';
      case 3: return 'disputed';
      default: return 'open'; // Default to open for any unknown status
    }
  };

  // Helper function to safely convert BigNumber to number with error handling
  const safeBigNumber = (value: any, fieldName: string) => {
    try {
      if (!value) {
        console.warn(`4.5.1 ${fieldName} is null or undefined`);
        return { value: 0, asNumber: 0 };
      }
      const num = ethers.BigNumber.isBigNumber(value) ? value.toNumber() : Number(value);
      if (isNaN(num)) {
        console.warn(`4.5.2 Could not convert ${fieldName} to number:`, value);
        return { value: 0, asNumber: 0 };
      }
      return { value: num, asNumber: num };
    } catch (error) {
      console.error(`4.5.3 Error converting ${fieldName}:`, error);
      return { value: 0, asNumber: 0 };
    }
  };

  // Helper function to safely parse BigNumber values
  const safeParseBigNumber = (value: any, defaultValue: number = 0): string => {
    try {
      if (!value) return defaultValue.toString();
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (value._isBigNumber) return value.toString();
      if (value.toNumber) return value.toNumber().toString();
      return defaultValue.toString();
    } catch (err) {
      console.warn('Error parsing BigNumber:', err);
      return defaultValue.toString();
    }
  };

  // Helper function to format dates
  const formatDate = (date: Date | number): string => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) 
        ? 'N/A' 
        : d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
    } catch (e) {
      console.warn('Error formatting date:', e);
      return 'N/A';
    }
  };

  // Helper function to safely parse timestamps
  const safeParseTimestamp = (value: any): Date => {
    try {
      if (!value) return new Date();
      let timestamp = 0;
      
      if (typeof value === 'string') {
        timestamp = parseInt(value);
      } else if (value._isBigNumber || value.toNumber) {
        timestamp = value.toNumber();
      } else if (typeof value === 'number') {
        timestamp = value;
      }
      
      // Check if timestamp is in seconds (common in blockchain) and convert to ms if needed
      if (timestamp > 1e12) { // If timestamp is in milliseconds
        return new Date(timestamp);
      } else { // Assume seconds
        return new Date(timestamp * 1000);
      }
    } catch (err) {
      console.warn('Error parsing timestamp:', err);
      return new Date();
    }
  };

  // Helper function to check if the current account is an officer
  const isOfficer = useCallback(async (): Promise<boolean> => {
    if (!officerContract || !account) {
      console.warn('Contract not initialized or account not connected');
      return false;
    }
    
    try {
      const isOfficer = await officerContract.isOfficer(account);
      console.log('Is officer:', isOfficer, 'for account:', account);
      return isOfficer;
    } catch (error) {
      console.error('Error checking officer status:', error);
      // Fallback to checking user authentication contract if officer check fails
      try {
        if (userAuthContract) {
          const isUserOfficer = await userAuthContract.isOfficer(account);
          console.log('Fallback isOfficer check:', isUserOfficer, 'for account:', account);
          return isUserOfficer;
        }
      } catch (fallbackError) {
        console.error('Fallback officer check failed:', fallbackError);
      }
      return false;
    }
  }, [officerContract, userAuthContract, account]);

  // Function to clean up deleted tenders from the contract
  const cleanupDeletedTenders = useCallback(async (tenderIds: string[]): Promise<string[]> => {
    if (!tenderContract || !account) {
      console.warn('Contract not initialized or account not connected');
      return [];
    }

    // Check if the current account is an officer
    const officerCheck = await isOfficer();
    if (!officerCheck) {
      console.warn('Only officers can clean up deleted tenders');
      return [];
    }

    const validTenderIds: string[] = [];
    const tendersToDelete: string[] = [];

    // First pass: Check which tenders are valid
    for (const id of tenderIds) {
      try {
        console.log(`Checking tender ${id}...`);
        const tender = await tenderContract.getTender(id);
        
        // A tender is considered valid if it has required fields
        const isValidTender = tender && 
          (tender.title || tender.creator || tender.createdAt);
        
        if (isValidTender) {
          console.log(`Tender ${id} is valid`);
          validTenderIds.push(id);
        } else {
          console.log(`Tender ${id} is invalid and will be cleaned up`);
          tendersToDelete.push(id);
        }
      } catch (error) {
        console.error(`Error checking tender ${id}:`, error);
        // If we can't check the tender, assume it's invalid
        tendersToDelete.push(id);
      }
    }

    // Second pass: Delete invalid tenders (if any)
    if (tendersToDelete.length > 0) {
      console.log(`Found ${tendersToDelete.length} tenders to delete`);
      
      // Delete tenders in batches to avoid gas limits
      const BATCH_SIZE = 5; // Adjust based on gas limits
      for (let i = 0; i < tendersToDelete.length; i += BATCH_SIZE) {
        const batch = tendersToDelete.slice(i, i + BATCH_SIZE);
        console.log(`Deleting batch ${i / BATCH_SIZE + 1}:`, batch);
        
        try {
          // Verify admin status again before each batch
          const adminCheck = await isAdmin();
          if (!adminCheck) {
            console.warn('Admin check failed during batch deletion');
            break;
          }
          
          // Call the contract's delete function for each tender in the batch
          for (const id of batch) {
            try {
              const tx = await tenderContract.deleteTender(id);
              await tx.wait();
              console.log(`Successfully deleted tender ${id}`);
            } catch (deleteError) {
              console.error(`Failed to delete tender ${id}:`, deleteError);
              // Keep the ID in the valid list if deletion fails
              validTenderIds.push(id);
            }
          }
        } catch (batchError) {
          console.error('Error in batch deletion:', batchError);
          // If batch deletion fails, add all in batch back to valid list
          validTenderIds.push(...batch);
        }
      }
    }

    return validTenderIds;
  }, [tenderContract, account, isOfficer]);

  const fetchTenders = useCallback(async (): Promise<FormattedTender[]> => {
    console.group('fetchTenders');
    try {
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        return [];
      }
      
      console.log('1. Fetching all tender IDs...');
      
      // Get all tender IDs
      let tenderIds: string[] = [];
      try {
        console.log('1.1 Calling getAllTenderIds()...');
        const ids = await tenderContract.getAllTenderIds();
        console.log('1.2 Raw response from getAllTenderIds():', ids);
        
        // Ensure we have an array of strings
        tenderIds = Array.isArray(ids) ? ids : [];
        console.log('1.3 Processed tender IDs:', tenderIds);
      } catch (error) {
        console.error('1.4 Error fetching tender IDs:', error);
        console.groupEnd();
        return [];
      }

      console.log(`2. Found ${tenderIds.length} tender(s) in the contract`);
      if (tenderIds.length === 0) {
        console.log('2.1 No tenders found in the contract');
        console.groupEnd();
        return [];
      }

      // Only clean up deleted tenders if user is an officer
      let validTenderIds = [...tenderIds];
      try {
        console.log('3. Checking if user is an officer...');
        const isUserOfficer = account ? await isOfficer() : false;
        console.log(`3.1 User is ${isUserOfficer ? 'an officer' : 'not an officer'}`);
        
        if (isUserOfficer) {
          console.log('3.2 User is an officer, checking for deleted tenders...');
          validTenderIds = await cleanupDeletedTenders(tenderIds);
          console.log('3.3 Valid tender IDs after cleanup:', validTenderIds);
          
          if (validTenderIds.length === 0) {
            console.log('3.4 No valid tenders found after cleanup');
            console.groupEnd();
            return [];
          }
        } else {
          console.log('3.5 User is not an officer or not connected, using all tender IDs');
        }
      } catch (error) {
        console.error('3.6 Error during officer check or cleanup:', error);
        // Continue with all tender IDs if there's an error
        validTenderIds = [...tenderIds];
      }

      // Helper function to get status text
      const getStatusText = (status: number): 'open' | 'closed' | 'awarded' | 'disputed' => {
        switch (status) {
          case 0: return 'open';
          case 1: return 'closed';
          case 2: return 'awarded';
          case 3: return 'disputed';
          default: return 'open';
        }
      };

      // Helper function to safely handle BigNumber values
      const safeBigNumber = (value: any, fieldName: string): { asNumber: number; asString: string } => {
        try {
          if (value === null || value === undefined) {
            console.log(`4.1.1 ${fieldName} is null or undefined`);
            return { asNumber: 0, asString: '0' };
          }
          
          if (ethers.BigNumber.isBigNumber(value)) {
            const str = value.toString();
            
            // For timestamps, we need to convert to number for Date objects
            if (fieldName === 'createdAt' || fieldName === 'endDate' || fieldName === 'startDate') {
              try {
                // Try to convert to number if it's a reasonable timestamp
                // Most timestamps are less than 2^32 (year 2106)
                if (value.lte(ethers.BigNumber.from('0xFFFFFFFF'))) {
                  return { asNumber: value.toNumber(), asString: str };
                } else {
                  console.warn(`4.1.2 ${fieldName} is not a valid timestamp:`, str);
                  return { asNumber: Math.floor(Date.now() / 1000), asString: str };
                }
              } catch (e) {
                console.warn(`4.1.3 Error converting timestamp ${fieldName}:`, e);
                return { asNumber: Math.floor(Date.now() / 1000), asString: str };
              }
            }
            
            // For status, which is uint8, it's safe to convert to number
            if (fieldName === 'status') {
              try {
                return { asNumber: value.toNumber(), asString: str };
              } catch (e) {
                console.warn(`4.1.4 Error converting status ${fieldName}:`, e);
                return { asNumber: 0, asString: str };
              }
            }
            
            // For other BigNumber values (like budget), keep them as strings
            return { asNumber: 0, asString: str };
          }
          
          // If it's not a BigNumber but a regular number
          if (typeof value === 'number' && !isNaN(value)) {
            return { asNumber: value, asString: value.toString() };
          }
          
          // For string values that should be numbers
          if (typeof value === 'string') {
            const num = Number(value);
            if (!isNaN(num)) {
              return { asNumber: num, asString: value };
            }
          }
          
          console.warn(`4.1.5 ${fieldName} is not a valid number:`, value);
          return { asNumber: 0, asString: value?.toString() || '0' };
          
        } catch (e) {
          console.warn(`4.1.6 Error processing ${fieldName}:`, e);
          return { asNumber: 0, asString: '0' };
        }
      };

      // Helper function to safely convert to string
      const safeToString = (value: any, fieldName: string, defaultValue: string = ''): string => {
        try {
          if (value === null || value === undefined) {
            console.log(`4.1.6 ${fieldName} is null or undefined, using default:`, defaultValue);
            return defaultValue;
          }
          // Handle BigNumber directly
          if (ethers.BigNumber.isBigNumber(value)) {
            return value.toString();
          }
          // Handle other types
          return value?.toString() || defaultValue;
        } catch (e) {
          console.warn(`4.1.7 Error converting ${fieldName} to string:`, e);
          return defaultValue;
        }
      };

      // Define the Tender type from the ABI
      type Tender = {
        id: string;
        title: string;
        description: string;
        estimatedValue: ethers.BigNumber;
        startDate: ethers.BigNumber;
        endDate: ethers.BigNumber;
        createdBy: string;
        status: number;
        createdAt: ethers.BigNumber;
        category: string;
        department: string;
        location: string;
        documents: string[];
      };

      // Function to manually decode the tender data
      const decodeTenderData = (data: string): Tender | null => {
        try {
          if (!data) return null;
          
          // Remove '0x' prefix if present
          const rawData = data.startsWith('0x') ? data.slice(2) : data;
          const chunks = rawData.match(/.{1,64}/g) || [];
          
          if (chunks.length === 0) {
            console.warn('No data chunks found in tender data');
            return null;
          }

          // Helper function to decode string from hex
          const decodeString = (hex: string): string => {
            if (!hex) return '';
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
              const hexByte = hex.slice(i, i + 2);
              if (!hexByte) continue;
              const byte = parseInt(hexByte, 16);
              if (isNaN(byte)) break;
              if (byte === 0) break; // Stop at null terminator
              str += String.fromCharCode(byte);
            }
            return str.replace(/[^\x20-\x7E]/g, '').trim();
          };

          // Helper to read string at offset
          const readStringAtOffset = (offset: number): string => {
            try {
              if (offset >= chunks.length * 32) {
                console.warn('Offset out of bounds:', offset);
                return '';
              }
              
              const chunkIndex = Math.floor(offset / 32);
              const chunkOffset = offset % 32;
              
              // Read the offset to the string data
              const stringOffset = parseInt(chunks[chunkIndex]?.slice(chunkOffset * 2, (chunkOffset + 32) * 2) || '0', 16);
              if (stringOffset >= chunks.length * 32) {
                console.warn('String offset out of bounds:', stringOffset);
                return '';
              }
              
              const stringChunkIndex = Math.floor(stringOffset / 32);
              const stringChunkOffset = stringOffset % 32;
              
              // Read the string length (first 32 bytes at the string offset)
              const lengthHex = chunks[stringChunkIndex]?.slice(stringChunkOffset * 2, (stringChunkOffset + 32) * 2) || '0';
              const length = parseInt(lengthHex, 16);
              
              if (isNaN(length) || length <= 0) {
                return '';
              }
              
              // Calculate start position of string data (after length)
              const dataStartChunk = stringChunkIndex + Math.floor((stringChunkOffset + 32) / 32);
              const dataStartOffset = (stringChunkOffset + 32) % 32;
              
              // Calculate how many chunks we need to read
              const totalBytes = length;
              const neededChunks = Math.ceil((totalBytes + dataStartOffset) / 32);
              
              // Read the string data
              let hexString = '';
              for (let i = 0; i < neededChunks; i++) {
                const chunk = chunks[dataStartChunk + i] || '';
                if (i === 0) {
                  hexString += chunk.slice(dataStartOffset * 2);
                } else {
                  hexString += chunk;
                }
              }
              
              // Trim to exact length and decode
              return decodeString(hexString.slice(0, totalBytes * 2));
            } catch (e) {
              console.warn('Error reading string at offset', offset, e);
              return '';
            }
          };

          // Read fixed-size values with safety checks
          const estimatedValue = chunks[3] ? ethers.BigNumber.from('0x' + chunks[3]) : ethers.BigNumber.from(0);
          const startDate = chunks[4] ? ethers.BigNumber.from('0x' + chunks[4]) : ethers.BigNumber.from(0);
          const endDate = chunks[5] ? ethers.BigNumber.from('0x' + chunks[5]) : ethers.BigNumber.from(0);
          const createdBy = chunks[6] ? '0x' + chunks[6].slice(24).padStart(40, '0') : ethers.constants.AddressZero;
          const status = chunks[7] ? parseInt(chunks[7], 16) : 0;
          const createdAt = chunks[8] ? ethers.BigNumber.from('0x' + chunks[8]) : ethers.BigNumber.from(Math.floor(Date.now() / 1000));

          // Read dynamic-size values using their head offsets with fallbacks
          const id = readStringAtOffset(0) || `tender-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const title = readStringAtOffset(1) || 'Untitled Tender';
          const description = readStringAtOffset(2) || 'No description available';
          
          // Read category, department, and location with fallbacks
          const category = chunks[9] ? readStringAtOffset(9 * 32) : 'Uncategorized';
          const department = chunks[10] ? readStringAtOffset(10 * 32) : 'General';
          const location = chunks[11] ? readStringAtOffset(11 * 32) : 'Not specified';

          // Handle documents array with safety checks
          let documents: { name: string; size: string; cid: string }[] = [];
          try {
            if (chunks[12]) {
              const documentsArrayOffset = parseInt(chunks[12], 16);
              if (!isNaN(documentsArrayOffset) && documentsArrayOffset < chunks.length * 32) {
                const lengthPos = Math.floor(documentsArrayOffset / 32);
                const documentsLength = chunks[lengthPos] ? parseInt(chunks[lengthPos], 16) : 0;
                
                if (documentsLength > 0) {
                  documents = [];
                  for (let i = 0; i < documentsLength; i++) {
                    const docOffset = documentsArrayOffset + 32 + (i * 32);
                    const docPos = Math.floor(docOffset / 32);
                    const docDataOffset = parseInt(chunks[docPos] || '0', 16);
                    
                    if (!isNaN(docDataOffset) && docDataOffset < chunks.length * 32) {
                      const docString = readStringAtOffset(docDataOffset);
                      if (docString) {
                        documents.push({
                          name: `Document ${i + 1}`,
                          size: '0 KB',
                          cid: docString
                        });
                      }
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Error reading documents array:', e);
          }

          const tender: Tender = {
            id,
            title,
            description,
            budget: estimatedValue,
            deadline: endDate,
            creator: createdBy,
            status,
            createdAt,
            category,
            department,
            location,
            documents,
            bidCount: 0,
            criteria: []
          };

          // Type assertion to handle dynamic properties
          const t = tender as any;
          
          // Log the successfully decoded tender data for debugging
          const logData = {
            id: t?.id || 'unknown',
            title: t?.title || 'No title',
            description: t?.description ? 
              (t.description.length > 50 ? t.description.substring(0, 47) + '...' : t.description) : 
              'No description',
            status: t?.status ?? 'unknown',
            createdAt: (t?.createdAt || t?.createDate)?.toString() || 'N/A',
            deadline: t?.deadline?.toString?.() || 'N/A',
            budget: (t?.budget || t?.budge || t?.budjet)?.toString() || '0',
            creator: t?.creator || t?.creatr || t?.createdBy || 'unknown',
            category: t?.category || 'Uncategorized',
            department: t?.department || 'General',
            location: t?.location || 'Not specified',
            documentCount: Array.isArray(t?.documents) ? t.documents.length : 0,
            bidCount: typeof t?.bidCount === 'number' ? t.bidCount : 0
          };
          
          console.log('4.1.2 Successfully decoded tender:', logData);
          return tender;

        } catch (error) {
          const errorInfo = {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorName: error instanceof Error ? error.name : 'UnknownError',
            errorStack: error instanceof Error ? error.stack : undefined,
            dataPreview: data ? data.substring(0, 200) + (data.length > 200 ? '...' : '') : 'No data',
            dataLength: data?.length || 0,
            timestamp: new Date().toISOString()
          };
          
          console.error('4.1.3 Error decoding tender data:', errorInfo);
          return null;
        }
      };

      console.log(`4. Processing ${validTenderIds.length} valid tender(s)...`);
      const tenders: FormattedTender[] = [];
      
      for (const id of validTenderIds) {
        console.group(`4.${tenders.length + 1} Processing tender ID: ${id}`);
        try {
          console.log('4.1 Fetching tender details...');
          
          // Get the raw encoded data from the contract
          const encodedData = await tenderContract.provider.call({
            to: tenderContract.address,
            data: tenderContract.interface.encodeFunctionData('getTender', [id])
          });
          
          console.log('4.2 Raw encoded data:', encodedData);
          
          // Check for revert reason (Error(string)) selector: 0x08c379a0
          if (encodedData && encodedData.startsWith('0x08c379a0')) {
            // Decode revert reason
            try {
              const abiCoder = new ethers.utils.AbiCoder();
              const reason = abiCoder.decode(['string'], '0x' + encodedData.slice(10));
              console.warn(`4.2.1 Tender contract call reverted for ID: ${id} (reason: ${reason})`);
            } catch (decodeError) {
              console.warn(`4.2.2 Tender contract call reverted for ID: ${id}, but could not decode reason.`);
            }
            continue;
          }

          // Decode the data manually
          const tender = decodeTenderData(encodedData);
          
          if (!tender) {
            console.warn('4.3 Could not decode tender data');
            continue;
          }
          
          console.log('4.4 Decoded tender data:', {
            id: tender.id,
            title: tender.title,
            status: tender.status,
            creator: tender.creator,
            deadline: tender.deadline?.toString?.() || 'N/A',
            budget: tender.budget?.toString?.() || '0'
          });

          // Format the tender data according to the FormattedTender interface
          // Safely parse the budget value
          const budgetValue = safeParseBigNumber(
            (tender as any).budget || (tender as any).budget || (tender as any).budjet || 0,
            0
          );
          const deadlineDate = safeParseTimestamp((tender as any).endDate || (tender as any).deadline || 0);
          const createdAtDate = safeParseTimestamp((tender as any).createdAt || (tender as any).createDate || Date.now());
          const creatorAddress = (tender as any).creator || (tender as any).createdBy || (tender as any).creatr || ethers.constants.AddressZero;

          const formattedTender: FormattedTender = {
            id: tender.id || `tender-${Date.now()}`,
            title: tender.title || 'Untitled Tender',
            description: tender.description || 'No description available',
            budget: budgetValue,
            formattedBudget: `${formatEther(budgetValue)} ETH`,
            deadline: deadlineDate.getTime() / 1000,
            createdAt: createdAtDate.getTime() / 1000,
            creator: creatorAddress,
            createdBy: creatorAddress,
            status: getStatusText((tender as any).status || 0),
            department: (tender as any).department || 'General',
            category: (tender as any).category || 'Uncategorized',
            location: (tender as any).location || 'Not specified',
            bidCount: (() => {
              try {
                const bidCount = (tender as any).bidCount;
                if (bidCount === undefined || bidCount === null) return 0;
                if (typeof bidCount === 'number') return bidCount;
                if (typeof bidCount === 'string') {
                  const parsed = parseInt(bidCount, 10);
                  return isNaN(parsed) ? 0 : parsed;
                }
                if (typeof bidCount.toNumber === 'function') {
                  return bidCount.toNumber();
                }
                return 0;
              } catch (e) {
                console.warn('Error parsing bidCount:', e);
                return 0;
              }
            })() as number,
            criteria: Array.isArray((tender as any).criteria) 
              ? (tender as any).criteria.map((c: any) => c.toString()) 
              : [],
            documents: Array.isArray((tender as any).documents) 
              ? (tender as any).documents.map((doc: any) => ({
                  name: doc.name || 'Document',
                  size: doc.size || '0 KB',
                  cid: doc.cid || doc.hash || ''
                }))
              : [],
            formattedDeadline: formatDate(deadlineDate),
            formattedCreatedAt: formatDate(createdAtDate)
          };

          console.log('4.5 Formatted tender:', {
            id: formattedTender.id,
            title: formattedTender.title,
            status: formattedTender.status,
            budget: formattedTender.budget,
            formattedBudget: formattedTender.formattedBudget,
            deadline: formattedTender.formattedDeadline
          });

          tenders.push(formattedTender);
          
          if (!tender.title && !tender.description && !tender.creator) {
            console.warn('4.5 Tender has no title, description, or creator, skipping');
            continue;
          }
          
          console.log('4.6 Processing tender fields...');
          
          // Safely convert values using our helper functions
          const deadline = safeBigNumber(tender.deadline, 'deadline');
          // Continue with the next tender instead of failing the whole operation
        } finally {
          console.groupEnd();
        }
      }

      console.log(`Successfully loaded ${tenders.length} valid tender(s)`);
      return tenders;
    } catch (error) {
      console.error('Error in fetchTenders:', error);
      return [];
    }
  }, [tenderContract, cleanupDeletedTenders, isOfficer, account]);

  // Context value
  // Implement the missing tender operation functions


  const fetchBidsForTender = useCallback(async (tenderId: number | string): Promise<any[]> => {
    try {
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        return [];
      }
      
      // In a real implementation, we would fetch bids from the contract
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error fetching bids for tender:', error);
      return [];
    }
  }, [tenderContract]);

  const closeTender = useCallback(async (tenderId: number | string): Promise<boolean> => {
    try {
      if (!tenderContract || !signer) {
        console.warn('Tender contract or signer not initialized');
        return false;
      }
      
      // Mock implementation - simulate closing a tender
      // In a real implementation, we would call the contract
      // await tenderContract.connect(signer).closeTender(tenderId);
      
      // Simulate a delay for the transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error closing tender:', error);
      return false;
    }
  }, [tenderContract, signer]);

  const awardTender = useCallback(async (tenderId: number | string, bidId: string): Promise<boolean> => {
    try {
      if (!tenderContract || !signer) {
        console.warn('Tender contract or signer not initialized');
        return false;
      }
      
      // Mock implementation - simulate awarding a tender
      // In a real implementation, we would call the contract
      // await tenderContract.connect(signer).awardTender(tenderId, bidId);
      
      // Simulate a delay for the transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error awarding tender:', error);
      return false;
    }
  }, [tenderContract, signer]);

  const disputeTender = useCallback(async (tenderId: number | string): Promise<boolean> => {
    try {
      if (!tenderContract || !signer) {
        console.warn('Tender contract or signer not initialized');
        return false;
      }
      
      // Mock implementation - simulate disputing a tender
      // In a real implementation, we would call the contract
      // await tenderContract.connect(signer).disputeTender(tenderId);
      
      // Simulate a delay for the transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error disputing tender:', error);
      return false;
    }
  }, [tenderContract, signer]);

  // Function to delete a tender
  const deleteTender = useCallback(async (tenderId: string): Promise<boolean> => {
    if (!tenderContract || !account) {
      console.warn('Contract not initialized or account not connected');
      return false;
    }

    try {
      // Check if the current account is an officer
      const officerCheck = await isOfficer();
      if (!officerCheck) {
        console.warn('Only officers can delete tenders');
        return false;
      }

      console.log(`Deleting tender ${tenderId}...`);
      const tx = await tenderContract.deleteTender(tenderId);
      await tx.wait();
      
      console.log(`Successfully deleted tender ${tenderId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete tender ${tenderId}:`, error);
      return false;
    }
  }, [tenderContract, account, isOfficer]);

  // Contract address and network name
  const contractAddress = '';
  const networkName = '';

  const value = useMemo(() => ({
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
    chainId,
    isCorrectNetwork,
    switchNetwork,
    officerContract,
    userAuthContract,
    tenderContract,
    provider,
    signer,
    addOfficer,
    updateOfficer,
    removeOfficer,
    getOfficer,
    getAllOfficers,
    createNewTender,
    fetchTenders,
    fetchTenderById,
    fetchBidsForTender,
    closeTender,
    awardTender,
    disputeTender,
    deleteTender,
    contractAddress,
    networkName,
  }), [
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
    chainId,
    isCorrectNetwork,
    switchNetwork,
    officerContract,
    userAuthContract,
    tenderContract,
    provider,
    signer,
    addOfficer,
    updateOfficer,
    removeOfficer,
    getOfficer,
    getAllOfficers,
    createNewTender,
    fetchTenders,
    fetchTenderById,
    fetchBidsForTender,
    closeTender,
    awardTender,
    disputeTender,
    deleteTender,
    contractAddress,
    networkName,
  ]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
