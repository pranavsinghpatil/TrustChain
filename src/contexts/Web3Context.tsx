import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback,
  useMemo,
  useRef
} from "react";
import { ethers, BigNumber, Contract, Signer, providers, JsonRpcSigner } from 'ethers';
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

    const defaultDate = Math.floor(Date.now() / 1000);
    const defaultStatus: TenderStatus = 'open';
    
    return {
      id: String(tender.id || ''),
      title: String(tender.title || ''),
      description: String(tender.description || ''),
      budget: String(tender.budget || '0'),
      formattedBudget: ethers.utils.formatEther(tender.budget || '0'),
      deadline: Number(tender.deadline || defaultDate + 86400),
      createdAt: Number(tender.createdAt || defaultDate),
      startDate: Number(tender.startDate || defaultDate),
      endDate: Number(tender.endDate || defaultDate + 86400),
      creator: String(tender.creator || ethers.constants.AddressZero),
      createdBy: String(tender.createdBy || ''),
      status: (tender.status && ['open', 'closed', 'awarded', 'disputed'].includes(tender.status))
        ? tender.status as TenderStatus
        : defaultStatus,
      department: String(tender.department || ''),
      category: String(tender.category || ''),
      location: String(tender.location || ''),
      bidCount: Number(tender.bidCount || 0),
      criteria: Array.isArray(tender.criteria) ? [...tender.criteria] : [],
      documents: Array.isArray(tender.documents) 
        ? tender.documents.map(doc => ({
            name: String(doc.name || 'Document'),
            size: String(doc.size || '0'),
            cid: String(doc.cid || '')
          }))
        : [],
      notes: String(tender.notes || ''),
      formattedDeadline: tenderHelpers.formatDate(tender.deadline || defaultDate + 86400),
      formattedCreatedAt: tenderHelpers.formatDate(tender.createdAt || defaultDate),
      formattedStartDate: tenderHelpers.formatDate(tender.startDate || defaultDate),
      formattedEndDate: tenderHelpers.formatDate(tender.endDate || defaultDate + 86400),
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

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'disputed';

type TenderBase = {
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
  documents: Array<{
    name: string;
    size: string;
    cid: string;
  }>;
  notes: string;
};

interface Tender extends TenderBase {
  // All properties are now inherited from TenderBase
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

export interface FormattedTender extends Omit<TenderBase, 'budget'> {
  budget: string; // Always string
  formattedBudget: string;
  formattedDeadline: string;
  formattedCreatedAt: string;
  formattedStartDate: string;
  formattedEndDate: string;
  status: TenderStatus;
}

export interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: JsonRpcSigner | null;
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
  // Connection state
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<EthersWeb3Provider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  
  // Contract instances
  const [officerContract, setOfficerContract] = useState<ethers.Contract | null>(null);
  const [userAuthContract, setUserAuthContract] = useState<ethers.Contract | null>(null);
  const [tenderContract, setTenderContract] = useState<ethers.Contract | null>(null);
  
  // Application state
  const [tenders, setTenders] = useState<FormattedTender[]>([]);
  const [currentTender, setCurrentTender] = useState<Tender | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [isOfficerState, setIsOfficerState] = useState<boolean>(false);
  
  // Refs for cleanup
  const isMounted = useRef(true);
  
  // Format tender data from contract
  const formatTender = useCallback((tenderData: any): FormattedTender | null => {
    if (!tenderData) return null;
    
    try {
      const deadline = tenderData.deadline ? new Date(tenderData.deadline.toNumber() * 1000) : new Date();
      const createdAt = tenderData.createdAt ? new Date(tenderData.createdAt.toNumber() * 1000) : new Date();
      const formattedTender: FormattedTender = {
        id: tenderData.id ? tenderData.id.toString() : '',
        title: tenderData.title || '',
        description: tenderData.description || '',
        budget: tenderData.budget ? tenderData.budget.toString() : '0',
        deadline: deadline.toISOString(),
        status: (tenderData.status as TenderStatus) || 'draft',
        createdAt: createdAt.toISOString(),
        documents: [],
        bids: [],
        createdBy: tenderData.createdBy || '',
        isActive: Boolean(tenderData.isActive),
        winner: tenderData.winner || '',
        formattedBudget: tenderData.budget ? ethers.utils.formatEther(tenderData.budget) : '0',
        formattedDeadline: deadline.toLocaleDateString(),
        formattedCreatedAt: createdAt.toLocaleDateString(),
        formattedStartDate: '',
        formattedEndDate: '',
        department: '',
        category: '',
        location: '',
        bidCount: 0,
        notes: ''
      };
      return formattedTender;
    } catch (err) {
      console.error('Error formatting tender data:', err);
      return null;
    }
  }, []);

  // Fetch all tenders from the contract
  const fetchTenders = useCallback(async (): Promise<FormattedTender[]> => {
    if (!tenderContract) return [];
    
    try {
      const tenderIds = await tenderContract.getAllTenderIds();
      const tenders = await Promise.all(
        tenderIds.map(async (id: BigNumber) => {
          try {
            const tenderData = await tenderContract.getTender(id);
            return formatTender(tenderData);
          } catch (err) {
            console.error(`Error fetching tender ${id}:`, err);
            return null;
          }
        })
      );
      return tenders.filter((t): t is FormattedTender => t !== null);
    } catch (err) {
      console.error('Error fetching tenders:', err);
      return [];
    }
  }, [tenderContract, formatTender]);

  // Fetch all officers from the contract
  const getAllOfficers = useCallback(async (): Promise<Officer[]> => {
    if (!officerContract) return [];
    
    try {
      const officerAddresses = await officerContract.getAllOfficers();
      const officers = await Promise.all(
        officerAddresses.map(async (address: string) => {
          try {
            const officerData = await officerContract.getOfficer(address);
            return {
              id: officerData.id,
              name: officerData.name,
              email: officerData.email,
              isActive: officerData.isActive,
              walletAddress: address,
              permissions: {
                canCreate: officerData.canCreate,
                canApprove: officerData.canApprove,
                isActive: officerData.isActive
              },
              createdAt: new Date(officerData.createdAt.toNumber() * 1000).getTime()
            };
          } catch (err) {
            console.error(`Error fetching officer ${address}:`, err);
            return null;
          }
        })
      );
      return officers.filter((o): o is Officer => o !== null);
    } catch (err) {
      console.error('Error fetching officers:', err);
      return [];
    }
  }, [officerContract]);

  // Initialize contracts
  const initContracts = useCallback(async (provider: ethers.providers.Web3Provider) => {
    if (!account) return null;
    
    try {
      const signerInstance = provider.getSigner();
      setSigner(signerInstance);

      // Initialize officer management contract
      const officerContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
        CONTRACT_ABI.OFFICER_MANAGEMENT,
        signerInstance
      );
      setOfficerContract(officerContractInstance);

      // Initialize user authentication contract
      const userAuthContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.USER_AUTHENTICATION,
        CONTRACT_ABI.USER_AUTHENTICATION,
        signerInstance
      );
      setUserAuthContract(userAuthContractInstance);

      // Initialize tender management contract
      const tenderContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        signerInstance
      );
      setTenderContract(tenderContractInstance);

      // Check if user is an officer
      try {
        const isOfficer = await officerContractInstance.isOfficer(account);
        setIsOfficerState(isOfficer);
        if (isOfficer) {
          const officerData = await officerContractInstance.getOfficer(account);
          setCurrentOfficer({
            id: officerData.id,
            name: officerData.name,
            email: officerData.email,
            isActive: officerData.isActive,
            walletAddress: account,
            permissions: {
              canCreate: officerData.canCreate,
              canApprove: officerData.canApprove,
              isActive: officerData.isActive
            },
            createdAt: new Date(officerData.createdAt.toNumber() * 1000).getTime()
          });
        }
      } catch (err) {
        console.error('Error checking officer status:', err);
        setIsOfficerState(false);
      }

      return { 
        officerContract: officerContractInstance, 
        userAuthContract: userAuthContractInstance, 
        tenderContract: tenderContractInstance 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error initializing contracts:', errorMessage);
      setError(`Failed to initialize contracts: ${errorMessage}`);
      return null;
    }
  }, [account]);

  // Connect to the user's wallet
  // Connect to the user's wallet
  const connectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask or another Web3 provider');
        return false;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      const web3Signer = web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setChainId(network.chainId);
      setIsConnected(true);
      
      // Initialize contracts
      const contracts = await initContracts(web3Provider);
      if (!contracts) {
        setError('Failed to initialize contracts');
        return false;
      }

      // Fetch initial data
      try {
        const tenders = await fetchTenders();
        setTenders(tenders);
        
        if (accounts[0]) {
          const officers = await getAllOfficers();
          setOfficers(officers);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        // Don't fail the connection if data fetch fails
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error connecting wallet:', errorMessage);
      setError(`Failed to connect wallet: ${errorMessage}`);
      return false;
    }
  }, [fetchTenders, getAllOfficers, initContracts]);


    try {
      const signerInstance = provider.getSigner();
      setSigner(signerInstance);

      // Initialize officer management contract
      const officerContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
        CONTRACT_ABI.OFFICER_MANAGEMENT,
        signerInstance
      );
      setOfficerContract(officerContractInstance);

      // Initialize user authentication contract
      const userAuthContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.USER_AUTHENTICATION, // Fixed contract name to match CONTRACT_ADDRESSES
        CONTRACT_ABI.USER_AUTHENTICATION, // Fixed contract name to match CONTRACT_ABI
        signerInstance
      );
      setUserAuthContract(userAuthContractInstance);

      // Initialize tender management contract
      const tenderContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        signerInstance
      );
      setTenderContract(tenderContractInstance);

      // Check if user is an officer
      try {
        const isOfficer = await officerContractInstance.isOfficer(account);
        setIsOfficerState(isOfficer);
        if (isOfficer) {
          const officerData = await officerContractInstance.getOfficer(account);
          setCurrentOfficer({
            id: officerData.id,
            name: officerData.name,
            email: officerData.email,
            isActive: officerData.isActive,
            walletAddress: account,
            permissions: {
              canCreate: officerData.canCreate,
              canApprove: officerData.canApprove,
              isActive: officerData.isActive
            },
            createdAt: new Date(officerData.createdAt.toNumber() * 1000).getTime()
          });
        }
      } catch (err) {
        console.error('Error checking officer status:', err);
        setIsOfficerState(false);
      }

      return { 
        officerContract: officerContractInstance, 
        userAuthContract: userAuthContractInstance, 
        tenderContract: tenderContractInstance 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error initializing contracts:', errorMessage);
      setError(`Failed to initialize contracts: ${errorMessage}`);
      return null;
    }
  }, [account]);

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

  // Helper to safely convert BigNumber to string
  const safeBigNumber = (value: any, defaultValue = '0'): string => {
    try {
      if (value === undefined || value === null) return defaultValue;
      if (ethers.BigNumber.isBigNumber(value)) {
        return value.toString();
      }
      if (typeof value === 'string' && value.startsWith('0x')) {
        return ethers.BigNumber.from(value).toString();
      }
      return String(value);
    } catch (e) {
      console.error('Error converting BigNumber:', e);
      return defaultValue;
    }
  };

  // Helper to safely parse timestamps
  const safeTimestamp = (value: any, defaultValue = Math.floor(Date.now() / 1000)): number => {
    try {
      if (value === undefined || value === null) return defaultValue;
      // If it's a BigNumber, convert to number
      if (ethers.BigNumber.isBigNumber(value)) {
        const num = value.toNumber();
        return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
      }
      // If it's a hex string, parse it
      if (typeof value === 'string' && value.startsWith('0x')) {
        const num = parseInt(value, 16);
        return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
      }
      // Otherwise, try to convert to number
      const num = Number(value);
      return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
    } catch (e) {
      console.error('Error parsing timestamp:', e);
      return defaultValue;
    }
  };

  const fetchTenders = useCallback(async (): Promise<FormattedTender[]> => {
    try {
      if (!tenderContract) {
        console.warn('Tender contract not initialized');
        setTenders([]);
        return [];
      }

      console.log('Fetching tenders from contract...');
      
      // First get all tender IDs
      const tenderIds = await tenderContract.getAllTenderIds();
      console.log('Tender IDs:', tenderIds);
      
      if (!tenderIds || tenderIds.length === 0) {
        console.log('No tenders found');
        setTenders([]);
        return [];
      }
      
      // Filter out any invalid or empty IDs and convert BigNumbers to strings
      const validTenderIds = tenderIds
        .filter((id: any) => id && id.toString() !== '0')
        .map((id: any) => id.toString());
      
      if (validTenderIds.length === 0) {
        console.log('No valid tender IDs found');
        setTenders([]);
        return [];
      }
      
      // Helper function to safely convert values to numbers
      const safeToNumber = (value: any, defaultValue = 0): number => {
        try {
          if (value === undefined || value === null) return defaultValue;
          if (ethers.BigNumber.isBigNumber(value)) {
            return value.toNumber();
          }
          const num = Number(value);
          return isNaN(num) ? defaultValue : num;
        } catch (e) {
          console.error('Error converting to number:', e);
          return defaultValue;
        }
      };

      // Create a provider for read-only operations
      const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      const readOnlyTenderContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        provider
      );
      
      // Fetch each tender by ID with better error handling and filter out null values
      const contractTenders = (await Promise.all(
        validTenderIds.map(async (id: string) => {
          try {
            // First check if the tender exists if the contract supports it
            try {
              if (typeof readOnlyTenderContract.doesTenderExist === 'function') {
                const exists = await readOnlyTenderContract.doesTenderExist(id);
                if (!exists) {
                  console.warn(`Tender ${id} does not exist`);
                  return null;
                }
              }
            } catch (err) {
              console.warn(`Error checking if tender ${id} exists:`, err);
              // Continue anyway as some contracts might not have this method
            }
            
            // Use callStatic to avoid gas estimation issues and get raw data
            const result = await readOnlyTenderContract.callStatic.getTender(id);
            
            // If result is an array (happens with some contract ABIs)
            const tenderData = Array.isArray(result) ? {
              id: result[0],
              title: result[1],
              description: result[2],
              estimatedValue: result[3],
              deadline: result[4],
              createdAt: result[5],
              startDate: result[6],
              endDate: result[7],
              createdBy: result[9],
              status: result[10],
              department: result[11],
              category: result[12],
              location: result[13] || '',
              bidCount: safeToNumber(result[14], 0),
              criteria: Array.isArray(result[15]) ? result[15] : [],
              documents: Array.isArray(result[16]) ? result[16] : [],
              notes: '' // Add default empty notes field
            } : result;

            // Helper to safely convert values to string
            const safeString = (value: any, defaultValue = ''): string => {
              try {
                return value !== undefined && value !== null ? String(value) : defaultValue;
              } catch (e) {
                console.error('Error converting value to string:', e);
                return defaultValue;
              }
            };
            
            // Helper to safely convert BigNumber to string without overflow
            const safeBigNumber = (value: any, defaultValue = '0'): string => {
              try {
                if (value === undefined || value === null) return defaultValue;
                if (ethers.BigNumber.isBigNumber(value)) {
                  return value.toString();
                }
                if (typeof value === 'string' && value.startsWith('0x')) {
                  return ethers.BigNumber.from(value).toString();
                }
                return String(value);
              } catch (e) {
                console.error('Error converting BigNumber:', e);
                return defaultValue;
              }
            };
            
            // Helper to safely parse timestamps
            const safeTimestamp = (value: any, defaultValue = Math.floor(Date.now() / 1000)): number => {
              if (value === undefined || value === null) return defaultValue;
              try {
                // If it's a BigNumber, convert to number
                if (ethers.BigNumber.isBigNumber(value)) {
                  const num = value.toNumber();
                  return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
                }
                // If it's a hex string, parse it
                if (typeof value === 'string' && value.startsWith('0x')) {
                  const num = parseInt(value, 16);
                  return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
                }
                // Otherwise, try to convert to number
                const strValue = safeBigNumber(value);
                const numValue = parseInt(strValue);
                return isNaN(numValue) ? defaultValue : Math.min(numValue, 2000000000);
              } catch (e) {
                console.error('Error parsing timestamp:', e);
                return defaultValue;
              }
            };

            // Parse documents if they exist in the result
            let documents: Array<{ name: string; size: string; cid: string }> = [];
            try {
              if (result?.[16] !== undefined) {
                const rawDocs = Array.isArray(result[16]) ? result[16] : [result[16]].filter(Boolean);
                documents = rawDocs.map(doc => ({
                  name: typeof doc === 'string' ? doc.split('/').pop() || 'Document' : 'Document',
                  size: '0',
                  cid: typeof doc === 'string' ? doc : ''
                }));
              } else if (result?.documents !== undefined) {
                const rawDocs = Array.isArray(result.documents) ? result.documents : [result.documents].filter(Boolean);
                documents = rawDocs.map(doc => ({
                  name: typeof doc === 'string' ? doc.split('/').pop() || 'Document' : 'Document',
                  size: '0',
                  cid: typeof doc === 'string' ? doc : ''
                }));
              }
            } catch (e) {
              console.error('Error parsing documents:', e);
              documents = [];
            }

            // Create the formatted tender object with all required properties
            const budget = safeBigNumber(result?.[3] || result?.budget || 0, '0');
            const deadline = safeTimestamp(result?.[4] || result?.deadline, 0);
            const createdAt = safeTimestamp(result?.[5] || result?.createdAt, Math.floor(Date.now() / 1000));
            const startDate = safeTimestamp(result?.[6] || result?.startDate, 0);
            const endDate = safeTimestamp(result?.[7] || result?.endDate, 0);
            
            const tender: FormattedTender = {
              // Base Tender properties
              id: id,
              title: safeString(result?.[1] || result?.title, 'Untitled Tender'),
              description: safeString(result?.[2] || result?.description, ''),
              budget: budget,
              deadline: deadline,
              createdAt: createdAt,
              startDate: startDate,
              endDate: endDate,
              creator: safeString(result?.[8] || result?.creator, ''),
              createdBy: safeString(result?.[9] || result?.createdBy, ''),
              status: status,
              department: safeString(result?.[11] || result?.department, ''),
              category: safeString(result?.[12] || result?.category, ''),
              location: safeString(result?.[13] || result?.location, ''),
              bidCount: safeToNumber(result?.[14] || result?.bidCount, 0),
              criteria: Array.isArray(result?.[15] || result?.criteria) ? result[15] : [],
              documents: documents,
              notes: safeString(result?.[17] || result?.notes, ''),
              
              // FormattedTender properties
              formattedBudget: `${ethers.utils.formatUnits(budget, 'ether')} ETH`,
              formattedDeadline: deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : 'N/A',
              formattedCreatedAt: createdAt ? new Date(Number(createdAt) * 1000).toLocaleDateString() : 'N/A',
              formattedStartDate: startDate ? new Date(Number(startDate) * 1000).toLocaleDateString() : 'N/A',
              formattedEndDate: endDate ? new Date(Number(endDate) * 1000).toLocaleDateString() : 'N/A'
            };
            
            return tender;
          } catch (err) {
            console.error(`Error processing tender ${id}:`, err);
            return null;
          }
        })
      );
      
      // Filter out any null entries and ensure type safety
      const validTenders = contractTenders.filter((t): t is FormattedTender => t !== null);
      
      setTenders(validTenders);
      return validTenders;
    } catch (err) {
      console.error('Error fetching tenders:', err);
      setTenders([]);
      return [];
    }
        return null;
      }
      
      if (!result || !result.id) {
        console.warn('Tender not found or invalid data:', result);
        return null;
      }
      
      // Convert status to TenderStatus
      const statuses: TenderStatus[] = ['open', 'closed', 'awarded', 'disputed'];
      let status: TenderStatus = 'open';
      
      try {
        if (result?.status !== undefined) {
          const statusValue = result.status;
          if (typeof statusValue === 'number' && statusValue >= 0 && statusValue < statuses.length) {
            status = statuses[statusValue];
          } else if (typeof statusValue === 'string' && statuses.includes(statusValue as TenderStatus)) {
            status = statusValue as TenderStatus;
          }
        }
      } catch (e) {
        console.error('Error parsing status:', e);
      }
      
      // Safely parse BigNumber values
      const parseBigNumber = (value: any, defaultValue = '0'): string => {
        try {
          if (!value) return defaultValue;
          // If it's a BigNumber, convert to string directly
          if (ethers.BigNumber.isBigNumber(value)) {
            return value.toString();
          }
          // If it's a hex string, parse it
          if (typeof value === 'string' && value.startsWith('0x')) {
            return ethers.BigNumber.from(value).toString();
          }
          // Otherwise, try to convert to string
          return String(value || defaultValue);
        } catch (e) {
          console.error('Error parsing BigNumber:', e);
          return defaultValue;
        }
      };
      
      // Safely parse timestamp values
      const parseTimestamp = (value: any, defaultValue = Math.floor(Date.now() / 1000)): number => {
        try {
          if (!value) return defaultValue;
          // If it's a BigNumber, convert to number
          if (ethers.BigNumber.isBigNumber(value)) {
            const num = value.toNumber();
            return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
          }
          // If it's a hex string, parse it
          if (typeof value === 'string' && value.startsWith('0x')) {
            const num = parseInt(value, 16);
            return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
          }
          // Otherwise, try to convert to number
          const num = Number(value);
          return isNaN(num) ? defaultValue : Math.min(num, 2000000000);
        } catch (e) {
          console.error('Error parsing timestamp:', e);
          return defaultValue;
        }
      };
      
      const now = Math.floor(Date.now() / 1000);
      const endDate = parseTimestamp(result?.endDate, now + 86400);
      const startDate = parseTimestamp(result?.startDate, now);
      const createdAt = parseTimestamp(result?.createdAt, now);
      
      // Ensure we have a valid tender ID
      const tenderId = result?.id ? String(result.id) : '';
      
      // Parse documents safely
      let documents: Array<{ name: string; size: string; cid: string }> = [];
      try {
        if (Array.isArray(result.documents)) {
          documents = result.documents.map((doc: any) => ({
            name: String((doc?.name || doc || '').toString().split('/').pop() || 'Document'),
            size: '0',
            cid: String(doc?.cid || doc || '')
          }));
        }
      } catch (e) {
        console.error('Error parsing documents:', e);
      }
      
      // Map contract data to our Tender interface
      const tender: Tender = {
        id: String(result.id || id || ''),
        title: String(result.title || ''),
        description: String(result.description || ''),
        budget: parseBigNumber(result.estimatedValue || result.budget, '0'),
        deadline: endDate,
        createdAt: createdAt,
        startDate: startDate,
        endDate: endDate,
        creator: String(result.creator || result.createdBy || ethers.constants.AddressZero),
        createdBy: String(result.createdBy || result.creator || 'Unknown'),
        status: status,
        department: String(result.department || ''),
        category: String(result.category || ''),
        location: String(result.location || ''),
        bidCount: 0, // This would need to be fetched separately
        criteria: [], // This would need to be fetched separately
        documents: documents,
        notes: String(result.notes || '')
      };

      // Format the tender for display
      const formattedTender: FormattedTender = {
        ...tender,
        budget: tender.budget, // Already a string from parseBigNumber
        formattedBudget: `${ethers.utils.formatUnits(tender.budget || '0', 'ether')} ETH`,
        formattedDeadline: new Date(tender.deadline * 1000).toLocaleDateString(),
        formattedCreatedAt: new Date(tender.createdAt * 1000).toLocaleDateString(),
        formattedStartDate: tender.startDate ? new Date(tender.startDate * 1000).toLocaleDateString() : 'N/A',
        formattedEndDate: tender.endDate ? new Date(tender.endDate * 1000).toLocaleDateString() : 'N/A',
        status: status
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

  // Check if connected to the correct network
  const isCorrectNetwork = useMemo(() => {
    if (!chainId) return false;
    return chainId === TARGET_NETWORK.chainId;
  }, [chainId]);

  // Check if connected to the correct network
  const isCorrectNetwork = useMemo(() => {
    if (!chainId) return false;
    return chainId === TARGET_NETWORK.chainId;
  }, [chainId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const contextValue = useMemo<Web3ContextType>(() => ({
    // Connection state
    account: account || null,
    isConnected,
    isLoading,
    error: error || null,
    chainId: chainId || 0,
    isCorrectNetwork,
    
    // Provider and signer
    provider: provider || undefined,
    signer: signer || undefined,
    
    // Contract instances
    officerContract: officerContract || undefined,
    userAuthContract: userAuthContract || undefined,
    tenderContract: tenderContract || undefined,
    
    // Data state
    tenders,
    tender: currentTender || undefined,
    officers,
    officer: currentOfficer || undefined,
    isOfficer: isOfficerState,
    
    // State setters and methods
    setTender: setCurrentTender,
    setOfficer: setCurrentOfficer,
    setIsOfficer: setIsOfficerState,
    setTenders,
    setOfficers,
    fetchTenders,
    getAllOfficers,
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

  // Create the context value
  const contextValue: Web3ContextType = {
    account,
    isConnected,
    isLoading,
    error,
    chainId,
    isCorrectNetwork: chainId === TARGET_NETWORK.chainId,
    provider,
    signer,
    officerContract,
    userAuthContract,
    tenderContract,
    tenders,
    tender: currentTender,
    officers,
    officer: currentOfficer,
    isOfficer: isOfficerState,
    connectWallet: useCallback(async () => {
      // Implementation here
      return false;
    }, []),
    disconnectWallet: useCallback(async () => {
      // Implementation here
    }, []),
    switchNetwork: useCallback(async () => {
      // Implementation here
      return false;
    }, []),
    addOfficer: useCallback(async (username: string, name: string, email: string) => {
      // Implementation here
      return false;
    }, []),
    updateOfficer: useCallback(async (walletAddress: string, name: string, username: string, email: string) => {
      // Implementation here
      return false;
    }, []),
    removeOfficer: useCallback(async (walletAddress: string) => {
      // Implementation here
      return false;
    }, []),
    getOfficer: useCallback(async (walletAddress: string) => {
      // Implementation here
      return null;
    }, []),
    getAllOfficers: useCallback(async () => {
      // Implementation here
      return [];
    }, []),
    createNewTender: useCallback(async (tender: TenderInput) => {
      // Implementation here
      return '';
    }, []),
    fetchTenders,
    fetchTenderById: useCallback(async (id: string) => {
      // Implementation here
      return null;
    }, []),
    closeTender: useCallback(async (tenderId: string) => {
      // Implementation here
      return false;
    }, []),
    awardTender: useCallback(async (tenderId: string, bidId: string) => {
      // Implementation here
      return false;
    }, []),
    disputeTender: useCallback(async (tenderId: string) => {
      // Implementation here
      return false;
    }, []),
    deleteTender: useCallback(async (tenderId: string) => {
      // Implementation here
      return false;
    }, []),
    fetchBidsForTender: useCallback(async (tenderId: string) => {
      // Implementation here
      return [];
    }, []),
    contractAddress: '',
    networkName: ''
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
