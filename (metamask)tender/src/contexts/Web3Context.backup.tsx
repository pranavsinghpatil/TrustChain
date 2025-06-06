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
}

export interface FormattedTender {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: Date;
  creator: string;
  status: 'open' | 'closed' | 'awarded' | 'disputed';
  createdAt: Date;
  category: string;
  department: string;
  location: string;
  documentCid?: string;
  bidCount?: number;
  criteria?: string[];
  documents: Array<{
    name: string;
    size: string;
    cid: string;
  }>;
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

    // Define a separate handler for chain changes
    // The ethereum provider expects different types for different events
    function handleChainChanged(chainId: string) {
      setChainId(parseInt(chainId, 16));
      window.location.reload();
    }

    if (window.ethereum) {
      // Add event listeners with proper typing
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged as unknown as (accounts: string[]) => void);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged as unknown as (accounts: string[]) => void);
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
          // Use ethers ABI coder directly
          const abiCoder = new ethers.utils.AbiCoder();
          const decodedData = abiCoder.decode([
            'tuple(string id, string title, string description, uint256 estimatedValue, ' +
            'uint256 startDate, uint256 endDate, address createdBy, uint8 status, ' +
            'uint256 createdAt, string category, string department, string location, ' +
            'string[] documents)'
          ], data);

          // Extract the first element which is our tender tuple
          const decoded = decodedData[0];
          
          // Create the tender object with proper typing
          const tender: Tender = {
            id: decoded.id || '',
            title: decoded.title || '',
            description: decoded.description || '',
            estimatedValue: decoded.estimatedValue,
            startDate: decoded.startDate,
            endDate: decoded.endDate,
            createdBy: decoded.createdBy,
            status: Number(decoded.status),
            createdAt: decoded.createdAt,
            category: decoded.category || '',
            department: decoded.department || '',
            location: decoded.location || '',
            documents: decoded.documents || []
          };

          console.log('4.1.2 Successfully decoded tender:', {
            id: tender.id,
            title: tender.title,
            description: tender.description?.substring(0, 30) + '...',
            status: tender.status,
            createdAt: tender.createdAt.toString(),
            endDate: tender.endDate.toString(),
            estimatedValue: tender.estimatedValue.toString(),
            category: tender.category,
            department: tender.department,
            location: tender.location
          });

          return tender;
        } catch (error) {
          console.error('4.1.3 Error decoding tender data:', {
            error,
            dataPreview: data.slice(0, 200) + '...',
            errorName: error?.name,
            errorMessage: error?.message
          });
          
          // Try alternative decoding method with defaultAbiCoder
          try {
            const defaultCoder = ethers.utils.defaultAbiCoder;
            const result = defaultCoder.decode([
              'string', 'string', 'string', 'uint256', 'uint256', 'uint256', 
              'address', 'uint8', 'uint256', 'string', 'string', 'string', 'string[]'
            ], data);
            
            const tender: Tender = {
              id: result[0] || '',
              title: result[1] || '',
              description: result[2] || '',
              estimatedValue: result[3],
              startDate: result[4],
              endDate: result[5],
              createdBy: result[6],
              status: Number(result[7]),
              createdAt: result[8],
              category: result[9] || '',
              department: result[10] || '',
              location: result[11] || '',
              documents: result[12] || []
            };
            
            console.log('4.1.4 Successfully decoded tender using alternative method:', {
              id: tender.id,
              title: tender.title
            });
            
            return tender;
          } catch (fallbackError) {
            console.error('4.1.5 Both decoding methods failed, using tenderId as fallback');
            
            // If all decoding fails, return a minimal tender with just the ID
            return null;
          }
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
            createdBy: tender.createdBy,
            endDate: tender.endDate.toString(),
            estimatedValue: tender.estimatedValue.toString()
          });
          
          if (!tender.title && !tender.description && !tender.createdBy) {
            console.warn('4.5 Tender has no title, description, or creator, skipping');
            continue;
          }
          
          console.log('4.6 Processing tender fields...');
          
          // Safely convert BigNumber values using our helper functions
          const endDate = safeBigNumber(tender.endDate, 'endDate');
          const createdAt = safeBigNumber(tender.createdAt, 'createdAt');
          const status = safeBigNumber(tender.status, 'status');
          const estimatedValue = safeBigNumber(tender.estimatedValue, 'estimatedValue');
          
          // Format the tender data safely
          const formattedTender: FormattedTender = {
            id: id,
            title: tender.title || safeToString(tender.title, 'title', `Tender ${id.substring(0, 8)}`),
            description: tender.description || safeToString(tender.description, 'description', 'No description available'),
            budget: estimatedValue.asString ? ethers.utils.formatEther(estimatedValue.asString) : '0',
            deadline: new Date(endDate.asNumber * 1000),
            creator: tender.createdBy || safeToString(tender.createdBy, 'creator', '0x0'),
            status: getStatusText(status.asNumber),
            createdAt: new Date(createdAt.asNumber * 1000),
            documentCid: '', // Not in the Tender type, will be empty
            department: tender.department || safeToString(tender.department, 'department', 'General'),
            category: tender.category || safeToString(tender.category, 'category', 'Uncategorized'),
            location: tender.location || safeToString(tender.location, 'location', 'Not specified'),
            bidCount: 0, // Default value, can be updated if needed
            criteria: [],
            documents: (tender.documents || []).map(doc => ({
              name: doc.split('/').pop() || 'document',
              size: '0',
              cid: doc
            }))
          };
          
          console.log('4.7 Successfully formatted tender:', {
            id: formattedTender.id,
            title: formattedTender.title,
            status: formattedTender.status,
            creator: formattedTender.creator,
            deadline: formattedTender.deadline,
            createdAt: formattedTender.createdAt
          });
          
          tenders.push(formattedTender);
        } catch (error) {
          console.error(`4.8 Error processing tender ${id}:`, error);
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


  const fetchTenderById = useCallback(async (tenderId: string): Promise<FormattedTender | null> => {
    try {
      console.log(`Fetching tender details for ID: ${tenderId}`);
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        return null;
      }

      // Try to get the tender data from the contract
      return null;
    }
    
    const tenderId = typeof id === 'number' ? `tender-${id}` : id.toString();
    console.log(`Fetching tender by ID: ${tenderId}`);
    
    try {
      console.log(`Calling getTender(${tenderId}) on contract...`);
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
