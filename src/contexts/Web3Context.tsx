import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback,
  useMemo
} from "react";
import { ethers, BigNumber } from 'ethers';
const { formatEther } = ethers.utils;
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "@/config/contracts";
import { TARGET_NETWORK } from "@/config/network";
import { Officer } from '../types/Officer';

// Helper functions
const formatDate = (date: Date | number | BigNumber): string => {
  try {
    let timestamp: number;
    if (date instanceof Date) {
      timestamp = date.getTime();
    } else if (typeof date === 'number') {
      timestamp = date * 1000;
    } else if (BigNumber.isBigNumber(date)) {
      timestamp = date.toNumber() * 1000;
    } else {
      return 'N/A';
    }

    const d = new Date(timestamp);
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

const safeParseBigNumber = (value: string | number | BigNumber): BigNumber => {
  try {
    if (!value) return BigNumber.from(0);
    if (BigNumber.isBigNumber(value)) return value;
    if (typeof value === 'string') {
      return value.startsWith('0x')
        ? BigNumber.from(value)
        : BigNumber.from(parseInt(value, 10));
    }
    if (typeof value === 'number') return BigNumber.from(value);
    return BigNumber.from(0);
  } catch (error) {
    console.error('Error parsing BigNumber:', error);
    return BigNumber.from(0);
  }
};

const safeParseTimestamp = (value: any): Date => {
  try {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value * 1000);
    if (typeof value === 'string') return new Date(parseInt(value, 10) * 1000);
    if (BigNumber.isBigNumber(value)) {
      const timestamp = value.toNumber() * 1000;
      return new Date(timestamp);
    }
    return new Date();
  } catch (error) {
    console.error('Error parsing timestamp:', error);
    return new Date();
  }
};

// Helper functions for tender data management
const tenderHelpers = {
  getTenderProp: <T,>(tender: Tender | null, key: keyof Tender, defaultValue: T): T => {
    if (!tender) return defaultValue;
    try {
      const value = tender[key];
      if (value === undefined || value === null) {
        return defaultValue;
      }
      
      if (value && typeof (value as any).toNumber === 'function') {
        try {
          return (value as any).toNumber() as T;
        } catch (e) {
          console.warn(`Error converting ${String(key)} to number:`, e);
          return defaultValue;
        }
      }
      
      if (typeof defaultValue === 'string') {
        return String(value) as T;
      }
      
      if (typeof defaultValue === 'number') {
        const num = Number(value);
        return isNaN(num) ? defaultValue : num as T;
      }
      
      return value as T;
    } catch (error) {
      console.warn(`Error accessing property ${String(key)}:`, error);
      return defaultValue;
    }
  },
  
  getString: (tender: Tender | null, key: keyof Tender, defaultValue = ''): string => {
    return tenderHelpers.getTenderProp<string>(tender, key, defaultValue);
  },

  getNumber: (tender: Tender | null, key: keyof Tender, defaultValue = 0): number => {
    return tenderHelpers.getTenderProp<number>(tender, key, defaultValue);
  },

  getCreator: (tender: Tender | null): string => {
    const creator = tenderHelpers.getTenderProp<string>(tender, 'creator', '');
    return creator || ethers.constants.AddressZero;
  },

  getBudget: (tender: Tender | null): string => {
    const budget = tenderHelpers.getTenderProp<string>(tender, 'budget', '0');
    return budget || '0';
  },

  getDeadline: (tender: Tender | null): number => {
    return tenderHelpers.getNumber(tender, 'deadline', 0);
  },

  getBidCount: (tender: Tender | null): number => {
    return tenderHelpers.getNumber(tender, 'bidCount', 0);
  },

  getArrayLength: (tender: Tender | null, key: keyof Tender): number => {
    const arr = tenderHelpers.getTenderProp<any[]>(tender, key, []);
    return Array.isArray(arr) ? arr.length : 0;
  },

  formatDate: (timestamp: number | Date): string => {
    try {
      if (!timestamp) return 'N/A';
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.warn('Error formatting date:', e);
      return 'Invalid date';
    }
  },

  formatTender: (tender: Tender | null): FormattedTender | null => {
    if (!tender) return null;

    return {
      id: String(tender.id),
      title: tender.title || '',
      description: tender.description || '',
      budget: tender.budget.toString() || '0',
      formattedBudget: ethers.utils.formatEther(tender.budget || '0'),
      deadline: tender.deadline || 0,
      createdAt: tender.createdAt || 0,
      creator: tender.creator || ethers.constants.AddressZero,
      createdBy: tender.createdBy || '',
      status: tender.status || 'open',
      department: tender.department || '',
      category: tender.category || '',
      location: tender.location || '',
      bidCount: Number(tender.bidCount || 0),
      criteria: tender.criteria || [],
      documents: tender.documents || [],
      formattedDeadline: tenderHelpers.formatDate(tender.deadline || 0),
      formattedCreatedAt: tenderHelpers.formatDate(tender.createdAt || 0),
      formattedStartDate: tender.startDate ? tenderHelpers.formatDate(tender.startDate) : undefined,
      formattedEndDate: tender.endDate ? tenderHelpers.formatDate(tender.endDate) : undefined,
    };
  },
};

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
  budget: ethers.BigNumber | string; // Can be BigNumber or string
  deadline: number;
  createdAt: number;
  startDate?: number;
  endDate?: number;
  creator: string;
  createdBy: string;
  status: 'open' | 'closed' | 'awarded' | 'disputed';
  department: string;
  category: string;
  location: string;
  bidCount: number;
  criteria: string[];
  documents: Array<{
    name: string;
    size: string;
    cid: string;
  }>;
  notes?: string;
}

export interface TenderInput {
  title: string;
  description: string;
  department: string;
  budget: string;
  startDate?: number;
  deadline: number;
  criteria: string[];
  documents: Array<{
    name: string;
    size: string;
    cid: string;
  }>;
  category?: string;
  location?: string;
}

export interface FormattedTender extends Omit<Tender, 'budget'> {
  budget: string; // Always string in formatted version
  formattedBudget: string;
  formattedDeadline: string;
  formattedCreatedAt: string;
  formattedStartDate?: string;
  formattedEndDate?: string;
}

export interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  officerContract: ethers.Contract | null;
  userAuthContract: ethers.Contract | null;
  tenderContract: ethers.Contract | null;
  tenders: FormattedTender[];
  tender: Tender | null;
  officers: Officer[];
  officer: Officer | null;
  isOfficer: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: () => Promise<boolean>;
  addOfficer: (username: string, name: string, email: string) => Promise<boolean>;
  updateOfficer: (walletAddress: string, name: string, username: string, email: string) => Promise<boolean>;
  removeOfficer: (walletAddress: string) => Promise<boolean>;
  getOfficer: (walletAddress: string) => Promise<Officer | null>;
  getAllOfficers: () => Promise<Officer[]>;
  createNewTender: (tender: TenderInput) => Promise<string>;
  fetchTenders: () => Promise<FormattedTender[]>;
  fetchTenderById: (id: string) => Promise<FormattedTender | null>;
  closeTender: (tenderId: string) => Promise<boolean>;
  awardTender: (tenderId: string, bidId: string) => Promise<boolean>;
  disputeTender: (tenderId: string) => Promise<boolean>;
  deleteTender: (tenderId: string) => Promise<boolean>;
  fetchBidsForTender: (tenderId: string) => Promise<any[]>;
  contractAddress: string;
  networkName: string;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [officerContract, setOfficerContract] = useState<ethers.Contract | null>(null);
  const [userAuthContract, setUserAuthContract] = useState<ethers.Contract | null>(null);
  const [tenderContract, setTenderContract] = useState<ethers.Contract | null>(null);
  
  // We'll fetch real tenders from the contract
  const [tenders, setTenders] = useState<FormattedTender[]>([]);
  const [tender, setTender] = useState<Tender | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [isOfficerState, setIsOfficerState] = useState(false);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return false;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      const web3Signer = web3Provider.getSigner();
      
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setIsConnected(true);
      
      // Initialize contracts
      const tenderContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        web3Signer
      );
      setTenderContract(tenderContractInstance);
      return true;
    } catch (err) {
      setError('Failed to connect wallet');
      return false;
    }
  }, []);

  const disconnectWallet = useCallback(async (): Promise<void> => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  }, []);

  const switchNetwork = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.ethereum) return false;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x5' }], // Goerli testnet
      });
      
      return true;
    } catch (err) {
      setError('Failed to switch network');
      return false;
    }
  }, []);

  const addOfficer = useCallback(async (username: string, name: string, email: string): Promise<boolean> => {
    if (!officerContract || !signer) return false;
    try {
      const tx = await officerContract.addOfficer(username, name, email);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to add officer');
      return false;
    }
  }, [officerContract, signer]);

  const updateOfficer = useCallback(async (walletAddress: string, name: string, username: string, email: string): Promise<boolean> => {
    if (!officerContract || !signer) return false;
    try {
      const tx = await officerContract.updateOfficer(walletAddress, name, username, email);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to update officer');
      return false;
    }
  }, [officerContract, signer]);

  const removeOfficer = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (!officerContract || !signer) return false;
    try {
      const tx = await officerContract.removeOfficer(walletAddress);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to remove officer');
      return false;
    }
  }, [officerContract, signer]);

  const getOfficer = useCallback(async (walletAddress: string): Promise<Officer | null> => {
    if (!officerContract) return null;
    try {
      const officer = await officerContract.getOfficer(walletAddress);
      return officer;
    } catch (err) {
      setError('Failed to get officer');
      return null;
    }
  }, [officerContract]);

  const getAllOfficers = useCallback(async (): Promise<Officer[]> => {
    if (!officerContract) return [];
    try {
      const officers = await officerContract.getAllOfficers();
      return officers;
    } catch (err) {
      setError('Failed to get officers');
      return [];
    }
  }, [officerContract]);

  const createNewTender = useCallback(async (data: TenderInput): Promise<string> => {
    if (!tenderContract || !signer) throw new Error('Tender contract not initialized');
    
    try {
      const tenderId = `tender-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = Math.floor(Date.now() / 1000);
      const startTimestamp = data.startDate ? Math.floor(data.startDate / 1000) : now;
      const endTimestamp = Math.floor(data.deadline / 1000);
      
      if (startTimestamp >= endTimestamp) {
        throw new Error('Start date must be before end date');
      }
      
      if (endTimestamp <= now) {
        throw new Error('End date must be in the future');
      }
      
      const documents = data.documents?.length > 0 ? data.documents.map(doc => doc.name) : [''];
      
      console.log('Creating tender with data:', {
        tenderId,
        title: data.title,
        description: data.description,
        budget: data.budget,
        startTimestamp,
        endTimestamp,
        category: data.category || 'General',
        department: data.department,
        location: data.location || '',
        documents
      });

      const tx = await tenderContract.createTender(
        tenderId,
        data.title,
        data.description,
        ethers.utils.parseEther(data.budget),
        startTimestamp,
        endTimestamp,
        data.category || 'General',
        data.department,
        data.location || '',
        documents
      );
      
      const receipt = await tx.wait();
      
      // After creating a tender, fetch all tenders to update the state
      await fetchTenders();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to create tender:', error);
      setError('Failed to create tender');
      return '';
    }
  }, [tenderContract, signer]);

  const fetchTenders = useCallback(async (): Promise<FormattedTender[]> => {
    try {
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        return [];
      }
      
      console.log('Fetching tenders from contract...');
      // Get the number of tenders from the contract
      const tenderCount = await tenderContract.getTenderCount();
      console.log('Tender count:', tenderCount.toString());
      
      const tenderPromises = [];
      for (let i = 0; i < tenderCount; i++) {
        tenderPromises.push(tenderContract.getTenderByIndex(i));
      }
      
      const tenderResults = await Promise.all(tenderPromises);
      console.log('Tender results:', tenderResults);
      
      // Map contract data to our Tender interface
      const contractTenders = tenderResults.map((result, index) => {
        try {
          return {
            id: result.id || `tender-${index}`,
            title: result.title || '',
            description: result.description || '',
            budget: result.budget || ethers.BigNumber.from(0),
            deadline: result.deadline ? Number(result.deadline) : Math.floor(Date.now() / 1000) + 86400, // 1 day from now
            createdAt: result.createdAt ? Number(result.createdAt) : Math.floor(Date.now() / 1000),
            startDate: result.startDate ? Number(result.startDate) : Math.floor(Date.now() / 1000),
            endDate: result.endDate ? Number(result.endDate) : Math.floor(Date.now() / 1000) + 86400,
            creator: result.creator || ethers.constants.AddressZero,
            createdBy: result.createdBy || 'Unknown',
            status: result.status || 'open',
            department: result.department || '',
            category: result.category || '',
            location: result.location || '',
            bidCount: result.bidCount ? Number(result.bidCount) : 0,
            criteria: result.criteria || [],
            documents: result.documents || [],
            notes: result.notes || ''
          };
        } catch (e) {
          console.error('Error parsing tender:', e);
          return null;
        }
      }).filter(Boolean) as Tender[];
      
      // Format the contract tenders
      const formattedTenders = contractTenders.map(tender => ({
        ...tender,
        budget: tender.budget.toString(), // Convert BigNumber to string
        formattedBudget: ethers.utils.formatEther(tender.budget) + ' ETH',
        formattedDeadline: new Date(tender.deadline * 1000).toLocaleDateString(),
        formattedCreatedAt: new Date(tender.createdAt * 1000).toLocaleDateString(),
        formattedStartDate: tender.startDate ? new Date(tender.startDate * 1000).toLocaleDateString() : undefined,
        formattedEndDate: tender.endDate ? new Date(tender.endDate * 1000).toLocaleDateString() : undefined
      }));
      
      setTenders(formattedTenders);
      return formattedTenders;
    } catch (err) {
      console.error('Error fetching tenders:', err);
      setTenders([]);
      return [];
    }
  }, [tenderContract]);

  const fetchTenderById = useCallback(async (id: string): Promise<FormattedTender | null> => {
    try {
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        return null;
      }
      
      // Get tender from contract
      const result = await tenderContract.getTenderById(id);
      if (!result || !result.id) return null;
      
      // Map contract data to our Tender interface
      const tender: Tender = {
        id: result.id,
        title: result.title || '',
        description: result.description || '',
        budget: result.budget || ethers.BigNumber.from(0),
        deadline: result.deadline ? Number(result.deadline) : Math.floor(Date.now() / 1000) + 86400,
        createdAt: result.createdAt ? Number(result.createdAt) : Math.floor(Date.now() / 1000),
        startDate: result.startDate ? Number(result.startDate) : Math.floor(Date.now() / 1000),
        endDate: result.endDate ? Number(result.endDate) : Math.floor(Date.now() / 1000) + 86400,
        creator: result.creator || ethers.constants.AddressZero,
        createdBy: result.createdBy || 'Unknown',
        status: result.status || 'open',
        department: result.department || '',
        category: result.category || '',
        location: result.location || '',
        bidCount: result.bidCount ? Number(result.bidCount) : 0,
        criteria: result.criteria || [],
        documents: result.documents || [],
        notes: result.notes || ''
      };

      const formattedTender = {
        ...tender,
        budget: tender.budget.toString(), // Convert BigNumber to string
        formattedBudget: ethers.utils.formatEther(tender.budget) + ' ETH',
        formattedDeadline: new Date(tender.deadline * 1000).toLocaleDateString(),
        formattedCreatedAt: new Date(tender.createdAt * 1000).toLocaleDateString(),
        formattedStartDate: tender.startDate ? new Date(tender.startDate * 1000).toLocaleDateString() : undefined,
        formattedEndDate: tender.endDate ? new Date(tender.endDate * 1000).toLocaleDateString() : undefined
      };

      return formattedTender;
    } catch (err) {
      console.error('Error fetching tender:', err);
      setError('Failed to fetch tender');
      return null;
    }
  }, [tenderContract]);

  const closeTender = useCallback(async (tenderId: string): Promise<boolean> => {
    if (!tenderContract || !signer) return false;
    try {
      const tx = await tenderContract.closeTender(tenderId);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to close tender');
      return false;
    }
  }, [tenderContract, signer]);

  const awardTender = useCallback(async (tenderId: string, bidId: string): Promise<boolean> => {
    if (!tenderContract || !signer) return false;
    try {
      const tx = await tenderContract.awardTender(tenderId, bidId);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to award tender');
      return false;
    }
  }, [tenderContract, signer]);

  const disputeTender = useCallback(async (tenderId: string): Promise<boolean> => {
    if (!tenderContract || !signer) return false;
    try {
      const tx = await tenderContract.disputeTender(tenderId);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to dispute tender');
      return false;
    }
  }, [tenderContract, signer]);

  const deleteTender = useCallback(async (tenderId: string): Promise<boolean> => {
    if (!tenderContract || !signer) return false;
    try {
      const tx = await tenderContract.deleteTender(tenderId);
      await tx.wait();
      return true;
    } catch (err) {
      setError('Failed to delete tender');
      return false;
    }
  }, [tenderContract, signer]);

  const fetchBidsForTender = useCallback(async (tenderId: string): Promise<any[]> => {
    if (!tenderContract) return [];
    try {
      const bids = await tenderContract.getBidsForTender(tenderId);
      return bids;
    } catch (err) {
      setError('Failed to fetch bids');
      return [];
    }
  }, [tenderContract]);

  const contractAddress = CONTRACT_ADDRESSES.TENDER_MANAGEMENT;
  const networkName = 'localhost';

  const contextValue = useMemo<Web3ContextType>(() => ({
    account,
    isConnected,
    isLoading,
    error,
    chainId,
    isCorrectNetwork,
    provider,
    signer,
    officerContract,
    userAuthContract,
    tenderContract,
    tenders,
    tender,
    officers,
    officer,
    isOfficer: isOfficerState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    addOfficer,
    updateOfficer,
    removeOfficer,
    getOfficer,
    getAllOfficers,
    createNewTender,
    fetchTenders,
    fetchTenderById,
    closeTender,
    awardTender,
    disputeTender,
    deleteTender,
    fetchBidsForTender,
    contractAddress,
    networkName
  }), [
    account,
    isConnected,
    isLoading,
    error,
    chainId,
    isCorrectNetwork,
    provider,
    signer,
    officerContract,
    userAuthContract,
    tenderContract,
    tenders,
    tender,
    officers,
    officer,
    isOfficerState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    addOfficer,
    updateOfficer,
    removeOfficer,
    getOfficer,
    getAllOfficers,
    createNewTender,
    fetchTenders,
    fetchTenderById,
    closeTender,
    awardTender,
    disputeTender,
    deleteTender,
    fetchBidsForTender,
    contractAddress,
    networkName
  ]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
