// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from "react";
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "@/config/contracts";
import { TARGET_NETWORK } from "@/config/network";
import { UserRole } from "@/types/auth";

// Simulated blockchain data store
const localStorageKeys = {
  officers: 'tender_officers',
  tenders: 'tender_tenders',
  bids: 'tender_bids',
  documents: 'tender_documents'
};

// Ensure localStorage has the correct keys on initialization
if (typeof window !== 'undefined') {
  // Initialize officers storage if it doesn't exist
  if (!localStorage.getItem(localStorageKeys.officers)) {
    localStorage.setItem(localStorageKeys.officers, '[]');
    console.log('[Web3Context] Initialized empty officers array in localStorage');
  }
  
  // Make sure window.officerTempStore is initialized
  if (!(window as any).officerTempStore) {
    try {
      const storedOfficers = localStorage.getItem(localStorageKeys.officers);
      (window as any).officerTempStore = storedOfficers ? JSON.parse(storedOfficers) : [];
      console.log('[Web3Context] Initialized officerTempStore from localStorage');
    } catch (err) {
      console.warn('[Web3Context] Error initializing officerTempStore:', err);
      (window as any).officerTempStore = [];
    }
  }
}

// Proper typing for window.ethereum
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

// Define proper types for contract return values
export interface OfficerPermissions {
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
  password?: string; // Add password field for local storage
  permissions: OfficerPermissions;
  createdAt: Date;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  documentCid: string;
  budget: ethers.BigNumber;
  deadline: ethers.BigNumber;
  creator: string;
  status: number;
  createdAt: ethers.BigNumber;
}

// Convert raw contract data to typed object
export interface FormattedTender {
  id: string;
  title: string;
  description: string;
  documentCid: string;
  budget: string;
  deadline: Date;
  creator: string;
  status: number;
  createdAt: Date;
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
  registerUser: (userData: { name: string; username: string; email: string; companyName: string; walletAddress: string }) => Promise<boolean>;
  createNewTender: (data: { title: string; description: string; department: string; budget: string; deadline: number; criteria: string[]; documents: { name: string; size: string }[] }) => Promise<string>;
  fetchTenders: () => Promise<FormattedTender[]>;
}

interface Web3ProviderProps {
  children: ReactNode;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within Web3Provider");
  return context;
};

const Web3ProviderComponent = ({ children }: Web3ProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [officerContract, setOfficerContract] = useState<ethers.Contract | null>(null);
  const [userAuthContract, setUserAuthContract] = useState<ethers.Contract | null>(null);
  const [tenderContract, setTenderContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isConnecting = useRef(false);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);

  // RPC provider for read-only operations
  const rpcProvider = useMemo(() => {
    try {
      return new ethers.providers.JsonRpcProvider(TARGET_NETWORK.rpcUrl);
    } catch (error) {
      console.error("Error creating RPC provider:", error);
      return null;
    }
  }, []);

  // Read-only contract instances
  const rpcOfficerContract = useMemo(() => {
    if (!rpcProvider) return null;
    try {
      return new ethers.Contract(
        CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
        CONTRACT_ABI.OFFICER_MANAGEMENT,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating RPC officer contract:", error);
      return null;
    }
  }, [rpcProvider]);

  const rpcTenderContract = useMemo(() => {
    if (!rpcProvider) return null;
    try {
      return new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating RPC tender contract:", error);
      return null;
    }
  }, [rpcProvider]);

  // Keep references to event handlers for proper cleanup
  const accountsChangedRef = useRef<(...args: any[]) => void>(() => {});
  const chainChangedRef = useRef<(...args: any[]) => void>(() => {});
  const disconnectRef = useRef<() => void>(() => {});

  // Setup read-only contract for fetching tenders before wallet connect
  useEffect(() => {
    const rpc = new ethers.providers.JsonRpcProvider(TARGET_NETWORK.rpcUrl);
    const readOnlyTender = new ethers.Contract(
      CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
      CONTRACT_ABI.TENDER_MANAGEMENT,
      rpc
    );
    setTenderContract(readOnlyTender);
  }, []);

  // Initialize provider and check connection on mount
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: "eth_requestAccounts" });
          console.log("[Web3Init] Ethereum accounts accessed successfully");

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          console.log("[Web3Init] Web3 Provider initialized", provider);

          const network = await provider.getNetwork();
          console.log("[Web3Init] Connected to network:", network);

          const signer = provider.getSigner();
          console.log("[Web3Init] Signer obtained");

          const address = await signer.getAddress();
          console.log("[Web3Init] Connected account address:", address);

          setProvider(provider);
          setSigner(signer);
          setAccount(address);
          setIsConnected(true);

          // Load contracts after provider is ready
          await loadContracts(provider, signer);
        } catch (error) {
          console.error("[Web3Init] Error initializing Web3 provider:", error);
          setError(error.message || "Failed to initialize Web3 provider");
        }
      } else {
        console.error("[Web3Init] MetaMask not detected");
        setError("MetaMask not detected. Please install MetaMask.");
      }
    };

    init();

    // Add a longer delay before setting up listeners to avoid MetaMask async errors
    setTimeout(() => {
      // Listen for account or network changes with error handling
      if (window.ethereum) {
        try {
          window.ethereum.on("accountsChanged", handleAccountsChanged);
          window.ethereum.on("chainChanged", handleChainChanged);
          console.log("[Web3Init] Event listeners set up successfully");
        } catch (listenerError) {
          console.error("[Web3Init] Error setting up event listeners:", listenerError);
        }
      }
    }, 1000);

    return () => {
      if (window.ethereum) {
        try {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          console.log("[Web3Init] Event listeners removed successfully");
        } catch (listenerError) {
          console.error("[Web3Init] Error removing event listeners:", listenerError);
        }
      }
    };
  }, []);

  const handleDisconnect = async () => {
    await disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
      variant: "destructive",
    });
  };

  const handleWalletConnection = async (web3Provider: ethers.providers.Web3Provider, address: string) => {
    try {
      const web3Signer = web3Provider.getSigner();
      setSigner(web3Signer);
      setAccount(address);
      setIsConnected(true);

      const network = await web3Provider.getNetwork();
      setChainId(network.chainId);
      setIsCorrectNetwork(network.chainId === TARGET_NETWORK.chainId);

      // Initialize contracts
      const officerContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
        CONTRACT_ABI.OFFICER_MANAGEMENT,
        web3Signer
      );
      console.debug('[Web3Context] officerContract initialized at', CONTRACT_ADDRESSES.OFFICER_MANAGEMENT);
      setOfficerContract(officerContractInstance);

      const userAuthContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.USER_AUTHENTICATION,
        CONTRACT_ABI.USER_AUTHENTICATION,
        web3Signer
      );
      setUserAuthContract(userAuthContractInstance);

      const tenderContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        web3Signer
      );
      setTenderContract(tenderContractInstance);

      // Store connection state
      localStorage.setItem("walletConnected", "true");
      setError(null);
    } catch (error) {
      console.error("Error in handleWalletConnection:", error);
      throw error;
    }
  };

  const handleAccountsChanged = (...args: any[]) => {
    const accounts = args[0];
    if (Array.isArray(accounts) && accounts.length === 0) {
      handleDisconnect();
    } else if (Array.isArray(accounts) && accounts[0]) {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  };

  const handleChainChanged = (...args: any[]) => {
    // Force a page refresh when a network change is detected
    window.location.reload();
  };

  const connectWallet = async (): Promise<boolean> => {
    console.log('[connectWallet] Attempting to connect wallet');
    if (isConnecting.current) {
      console.log('[connectWallet] Already connecting, skipping');
      return false; // Prevent multiple requests
    }

    if (typeof window.ethereum === 'undefined') {
      const errorMsg = "MetaMask is not installed. Please install MetaMask to use this application.";
      setError(errorMsg);
      console.error(errorMsg);
      toast({
        title: "Wallet Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    }

    isConnecting.current = true;
    setError(null);
    setIsLoading(true);

    try {
      console.log('[connectWallet] Requesting accounts directly from ethereum provider');
      
      // First try the direct ethereum request method which is more reliable for triggering the popup
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('[connectWallet] Accounts received:', accounts);
      } catch (requestError) {
        console.error('[connectWallet] Direct request failed:', requestError);
        
        // Fall back to provider method
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        accounts = await web3Provider.send("eth_requestAccounts", []);
        console.log('[connectWallet] Accounts from provider:', accounts);
      }

      if (!accounts || accounts.length === 0) {
        const errorMsg = "No accounts found. Please check MetaMask and approve the connection.";
        setError(errorMsg);
        toast({
          title: "Wallet Error",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      }

      const address = accounts[0];
      console.log('[connectWallet] Connected address:', address);
      
      // Initialize provider after successful connection
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      handleWalletConnection(web3Provider, address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });
      
      return true;
    } catch (error: any) {
      const errorMsg = error.message || "Failed to connect wallet";
      setError(errorMsg);
      console.error("[connectWallet] Error connecting wallet:", error);
      toast({
        title: "Wallet Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    } finally {
      isConnecting.current = false;
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setAccount(null);
      setIsConnected(false);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      setIsCorrectNetwork(false);
      setOfficerContract(null);
      setUserAuthContract(null);
      setTenderContract(null);
      setError(null);
      
      localStorage.removeItem("walletConnected");
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error: any) {
      console.error("Error disconnecting wallet:", error);
      setError(error.message || "Failed to disconnect wallet");
    }
  };

  // Switch to the target network
  const switchNetwork = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) return false;
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${TARGET_NETWORK.chainId.toString(16)}` }],
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${TARGET_NETWORK.chainId.toString(16)}`,
                  chainName: TARGET_NETWORK.name,
                  rpcUrls: [TARGET_NETWORK.rpcUrl],
                  nativeCurrency: TARGET_NETWORK.nativeCurrency,
                },
              ],
            });
            return true;
          } catch (addError) {
            console.error("Error adding network:", addError);
            return false;
          }
        }
        console.error("Error switching network:", switchError);
        return false;
      }
    } catch (error) {
      console.error("Error in switchNetwork:", error);
      return false;
    }
  };

  // Smart contract interaction functions
  
  // Add an officer to the blockchain
  const addOfficer = async (username: string, name: string, email: string): Promise<boolean> => {
    // Force wallet connection first
    if (!isConnected || !account) {
      console.log('[addOfficer] Not connected, attempting to connect wallet first');
      const connected = await connectWallet();
      if (!connected) {
        toast({
          title: "Wallet Required",
          description: "Please connect your wallet to create an officer",
          variant: "destructive",
        });
        return false;
      }
      // Wait a moment for connection to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    try {
      console.log('[addOfficer] called with:', { username, name, email });
      console.log('[addOfficer] account:', account);
      console.log('[addOfficer] signer:', signer);
      console.log('[addOfficer] officerContract:', officerContract);

      if (!officerContract || !signer) {
        const connected = await connectWallet();
        console.log('[addOfficer] connectWallet called, connected:', connected, 'officerContract:', officerContract, 'signer:', signer);
        if (!connected || !officerContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }

      if (!account) {
        throw new Error("No wallet account connected");
      }

      // Check if officer with this username already exists
      const officers = await getAllOfficers();
      const existingOfficer = officers.find(officer => officer.username === username);
      if (existingOfficer) {
        console.error("Officer with this username already exists");
        return false;
      }

      // Generate a unique ID for the officer
      const id = `officer-${Date.now()}`;
      
      try {
        // Add officer to contract with all required parameters
        const tx = await officerContract.addOfficer(account, id, name, username, email);
        console.log('[addOfficer] Transaction sent:', tx.hash);
        
        // Wait for transaction confirmation with timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 30000)
          )
        ]);
        
        console.log('[addOfficer] Transaction confirmed:', receipt.transactionHash);
      } catch (err) {
        console.error('[addOfficer] Transaction failed:', err);
        throw new Error(`Failed to add officer: ${err.message}`);
      }

      // Store officer credentials in multiple places for cross-browser access
      const defaultPassword = 'tender00';
      
      // 1. Store in sessionStorage (current browser only)
      try {
        sessionStorage.setItem(`officer_${username}`, JSON.stringify({
          username,
          password: defaultPassword
        }));
        console.log(`[addOfficer] Stored credentials for ${username} in sessionStorage`);
      } catch (err) {
        console.warn(`[addOfficer] Error storing in sessionStorage:`, err);
      }
      
      // 2. Store in localStorage.officers (shared across browsers)
      try {
        const newOfficer: Officer = {
          id,
          name,
          username,
          email,
          password: defaultPassword,
          isActive: true,
          walletAddress: account,
          permissions: {
            canCreate: true,
            canApprove: true,
            isActive: true
          },
          createdAt: new Date()
        };
        
        const localOfficers = JSON.parse(localStorage.getItem(localStorageKeys.officers) || '[]');
        localOfficers.push(newOfficer);
        localStorage.setItem(localStorageKeys.officers, JSON.stringify(localOfficers));
        (window as any).officerTempStore = localOfficers;
        console.log(`[addOfficer] Stored officer in localStorage.officers: ${username}`);
      } catch (err) {
        console.warn(`[addOfficer] Error storing in localStorage.officers:`, err);
      }
      
      // 3. Store in trustchain_users (shared across browsers)
      try {
        const storedUsers = localStorage.getItem('trustchain_users') || '[]';
        const users = JSON.parse(storedUsers);
        users.push({
          id,
          name,
          username,
          email,
          role: 'officer',
          walletAddress: account,
          createdAt: new Date(),
          isApproved: true,
          permissions: {
            canCreate: true,
            canApprove: true,
            isActive: true
          }
        });
        localStorage.setItem('trustchain_users', JSON.stringify(users));
        console.log(`[addOfficer] Stored officer in trustchain_users: ${username}`);
      } catch (err) {
        console.warn(`[addOfficer] Error storing in trustchain_users:`, err);
      }
      
      // 4. Store password in trustchain_passwords (shared across browsers)
      try {
        const storedPasswords = localStorage.getItem('trustchain_passwords') || '{}';
        const passwords = JSON.parse(storedPasswords);
        passwords[username] = defaultPassword;
        localStorage.setItem('trustchain_passwords', JSON.stringify(passwords));
        console.log(`[addOfficer] Stored password in trustchain_passwords: ${username}`);
      } catch (err) {
        console.warn(`[addOfficer] Error storing in trustchain_passwords:`, err);
      }

      toast({
        title: "Success",
        description: `Officer ${username} added successfully. Password: tender00`,
      });

      // Attempt to refresh officers list after creation
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('officerCreated'));
      }

      return true;
    } catch (error: any) {
      // Check if the error is because the officer already exists
      if (error.message && error.message.includes('Officer already exists')) {
        console.log('[addOfficer] Officer already exists error caught');
        
        // Store officer credentials for login anyway
        try {
          sessionStorage.setItem(`officer_${username}`, JSON.stringify({
            username,
            password: 'tender00'
          }));
          console.log(`[addOfficer] Stored credentials for existing officer ${username}`);
          
          toast({
            title: "Officer Already Exists",
            description: `Using existing officer. Password: tender00`,
          });
          
          // Return true to indicate success - we're treating this as a successful operation
          return true;
        } catch (err) {
          console.warn(`[addOfficer] Error storing credentials:`, err);
        }
      }
      
      console.error("Error adding officer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add officer",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateOfficer = async (walletAddress: string, name: string, username: string, email: string): Promise<boolean> => {
    try {
      // Ensure wallet connected
      if (!officerContract || !signer) {
        const connected = await connectWallet();
        if (!connected || !officerContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }

      // Update officer in contract
      const tx = await officerContract.updateOfficer(walletAddress, name, username, email);
      await tx.wait();

      toast({
        title: "Success",
        description: `Officer ${username} updated successfully`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating officer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update officer",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeOfficer = async (walletAddress: string): Promise<boolean> => {
    try {
      // Ensure wallet connected
      if (!officerContract || !signer) {
        const connected = await connectWallet();
        if (!connected || !officerContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }

      // Remove officer from contract
      const tx = await officerContract.removeOfficer(walletAddress);
      await tx.wait();

      toast({
        title: "Success",
        description: `Officer removed successfully`,
      });

      return true;
    } catch (error: any) {
      console.error("Error removing officer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove officer",
        variant: "destructive",
      });
      return false;
    }
  };

  // Register a new user on the blockchain
  const registerUser = async (userData: { name: string; username: string; email: string; companyName: string; walletAddress: string }): Promise<boolean> => {
    console.log("[registerUser] Starting user registration on blockchain", userData);
    try {
      // Ensure wallet is connected
      if (!userAuthContract || !signer) {
        console.log("[registerUser] Wallet not connected, connecting...");
        const connected = await connectWallet();
        console.log("[registerUser] connectWallet result:", connected);
        if (!connected || !userAuthContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }

      if (!account) {
        throw new Error("No wallet account connected");
      }

      console.log("[registerUser] Wallet connected, account:", account);
      console.log("[registerUser] userAuthContract:", userAuthContract);

      // Generate a unique ID for the user
      const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      console.log("[registerUser] Generated userId:", userId);
      
      try {
        // Call the smart contract to register the user
        console.log("[registerUser] Calling smart contract with params:", {
          walletAddress: userData.walletAddress,
          userId,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: "bidder",
          companyName: userData.companyName
        });
        
        // Call the registerUser function on the smart contract
        const tx = await userAuthContract.registerUser(
          userData.walletAddress,
          userId,
          userData.name,
          userData.username,
          userData.email,
          "bidder",
          userData.companyName,
          "", // Additional fields can be empty for now
          "",
          "",
          0,
          "",
          "",
          "",
          "",
          "Indian"
        );
        
        console.log("[registerUser] Transaction sent:", tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("[registerUser] Transaction confirmed:", receipt.transactionHash);
        
        toast({
          title: "Success",
          description: "User registered on blockchain successfully!",
        });
        
        return true;
      } catch (err) {
        console.error("[registerUser] Transaction failed:", err);
        throw new Error(`Failed to register user on blockchain: ${err.message}`);
      }
    } catch (error: any) {
      console.error("[registerUser] Error registering user:", error);
      toast({
        title: "Registration Error",
        description: error.message || "Failed to register user on blockchain",
        variant: "destructive",
      });
      return false;
    }
  };

  const getOfficer = async (walletAddress: string): Promise<Officer | null> => {
    if (!officerContract) {
      console.error("Officer contract not initialized");
      return null;
    }
    try {
      try {
        // Get raw contract data without any conversion
        const rawData = await officerContract['getOfficer(address)'].staticCall(walletAddress);
        
        // Handle each field with extreme safety
        let id = typeof rawData[0] === 'string' ? rawData[0] : `officer-${walletAddress.slice(2, 8)}`;
        let name = typeof rawData[1] === 'string' ? rawData[1] : 'Officer';
        let username = typeof rawData[2] === 'string' ? rawData[2] : `user-${walletAddress.slice(2, 6)}`;
        let email = typeof rawData[3] === 'string' ? rawData[3] : `${username}@org.com`;
        let isActive = Boolean(rawData[4]);
        
        // Handle timestamp as string only - NEVER convert to number
        let createdAt = rawData[5]?.toString() || Date.now().toString();
        
        console.log('[Officer Data] Processed safely:', {
          id, name, username, email, isActive
        });
        
        return {
          id,
          walletAddress,
          name,
          username,
          email,
          isActive,
          permissions: {
            canCreate: isActive,
            canApprove: isActive,
            isActive
          },
          createdAt: new Date(parseInt(createdAt, 10))
        };
      } catch (err) {
        // Create minimal viable officer data
        let id = `officer-${walletAddress.slice(2, 8)}`;
        let name = 'Officer';
        let username = `user-${walletAddress.slice(2, 6)}`;
        let email = `${username}@org.com`;
        let isActive = true;
        let createdAt = Date.now().toString();
        
        console.warn('[Officer Recovery] Created fallback data for:', walletAddress);
        
        return {
          id,
          walletAddress,
          name,
          username,
          email,
          isActive,
          permissions: {
            canCreate: isActive,
            canApprove: isActive,
            isActive
          },
          createdAt: new Date(parseInt(createdAt, 10))
        };
      }
    } catch (error) {
      console.error("[getOfficer] Error getting officer (outer):", error);
      return null;
    }
  };

  const getAllOfficers = async (): Promise<Officer[]> => {
    // First try to get officers from all possible localStorage sources
    let localOfficers: Officer[] = [];
    let officersFound = false;
    
    // Check all possible localStorage keys that might contain officers
    const keysToCheck = [
      localStorageKeys.officers,
      'trustchain_users',
      'tender_officers'
    ];
    
    for (const key of keysToCheck) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (Array.isArray(parsed)) {
            // Filter to only include items that look like officers
            const officers = parsed.filter((item: any) => 
              item.username && 
              (item.role === 'officer' || item.permissions)
            );
            
            if (officers.length > 0) {
              console.log(`[getAllOfficers] Found ${officers.length} officers in localStorage key: ${key}`);
              
              // Add any officers not already in localOfficers
              const existingUsernames = new Set(localOfficers.map(o => o.username));
              for (const officer of officers) {
                if (!existingUsernames.has(officer.username)) {
                  // Ensure the officer has all required fields
                  const completeOfficer: Officer = {
                    id: officer.id || `officer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: officer.name || officer.username,
                    username: officer.username,
                    email: officer.email || `${officer.username}@example.com`,
                    walletAddress: officer.walletAddress || '',
                    isActive: officer.isActive || true,
                    password: officer.password || 'tender00',
                    permissions: officer.permissions || { canCreate: true, canApprove: true, isActive: true },
                    createdAt: officer.createdAt ? new Date(officer.createdAt) : new Date()
                  };
                  
                  localOfficers.push(completeOfficer);
                  existingUsernames.add(officer.username);
                  officersFound = true;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[getAllOfficers] Error reading from ${key}:`, err);
      }
    }
    
    // Also check window.officerTempStore as a backup
    try {
      if ((window as any).officerTempStore && Array.isArray((window as any).officerTempStore)) {
        const tempStoreOfficers = (window as any).officerTempStore;
        if (tempStoreOfficers.length > 0) {
          console.log(`[getAllOfficers] Found ${tempStoreOfficers.length} officers in officerTempStore`);
          
          // Add any officers not already in localOfficers
          const existingUsernames = new Set(localOfficers.map(o => o.username));
          for (const officer of tempStoreOfficers) {
            if (officer.username && !existingUsernames.has(officer.username)) {
              localOfficers.push(officer);
              existingUsernames.add(officer.username);
              officersFound = true;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[getAllOfficers] Error reading from officerTempStore:', err);
    }
    
    // If officers were found, save the combined list back to localStorage
    if (officersFound) {
      try {
        localStorage.setItem(localStorageKeys.officers, JSON.stringify(localOfficers));
        (window as any).officerTempStore = localOfficers;
        console.log(`[getAllOfficers] Saved ${localOfficers.length} officers to localStorage and officerTempStore`);
      } catch (err) {
        console.warn('[getAllOfficers] Error saving officers to localStorage:', err);
      }
    }

    // If we have local officers and no contract, return them
    if (localOfficers.length > 0 && !officerContract) {
      console.log(`[getAllOfficers] Returning ${localOfficers.length} officers from localStorage (no contract)`);
      return localOfficers;
    }

    // Try to get officers from blockchain if contract is available
    if (!officerContract) {
      console.warn("Officer contract not initialized, using only localStorage officers");
      return localOfficers;
    }

    try {
      // Get all officer addresses first
      const officerAddresses = await officerContract.getAllOfficerAddresses();
      const officers: Officer[] = [];
      const usernamesFromContract = new Set<string>();

      // Get details for each officer from contract
      for (const address of officerAddresses) {
        try {
          let id = "", name = "", username = "", email = "", isActive = false;
          let createdAt = '0';
          try {
            // Get raw contract data
            const rawData = await officerContract['getOfficer(address)'].staticCall(address);
            id = typeof rawData[0] === 'string' ? rawData[0] : '';
            name = typeof rawData[1] === 'string' ? rawData[1] : '';
            username = typeof rawData[2] === 'string' ? rawData[2] : '';
            email = typeof rawData[3] === 'string' ? rawData[3] : '';
            isActive = Boolean(rawData[4]);
            createdAt = rawData[5]?.toString() || Date.now().toString();

            // Only add if username and id are present
            if (!id || !username) {
              console.warn(`[getAllOfficers] Skipping officer with missing id/username: ${address}`);
              continue;
            }

            const officer: Officer = {
              id,
              walletAddress: address,
              name,
              username,
              email,
              isActive,
              permissions: {
                canCreate: isActive,
                canApprove: isActive,
                isActive: isActive
              },
              createdAt: new Date(parseInt(createdAt, 10))
            };
            officers.push(officer);
            usernamesFromContract.add(username);
            
            // Store officer credentials in both sessionStorage and localStorage for cross-browser access
            console.log(`[getAllOfficers] Successfully added officer from contract: ${username} (${id})`);
            try {
              // Store in sessionStorage for current browser
              sessionStorage.setItem(`officer_${username}`, JSON.stringify({
                username,
                password: 'tender00'
              }));
              
              // Also update the PASSWORD_MAP which is stored in localStorage
              const passwordMap = JSON.parse(localStorage.getItem('trustchain_passwords') || '{}');
              passwordMap[username] = 'tender00';
              localStorage.setItem('trustchain_passwords', JSON.stringify(passwordMap));
              
              console.log(`[getAllOfficers] Stored credentials for ${username} in both storages`);
            } catch (err) {
              console.warn(`[getAllOfficers] Failed to store officer credentials:`, err);
            }
          } catch (err) {
            // If contract call fails, skip this officer
            console.warn('[Officer Recovery] Skipping officer due to contract data error:', address);
            continue;
          }
        } catch (err) {
          console.error(`[getAllOfficers] Error processing officer ${address}:`, err);
        }
      }
      
      // Add any officers from localStorage that weren't found in the contract
      for (const localOfficer of localOfficers) {
        if (!usernamesFromContract.has(localOfficer.username)) {
          console.log(`[getAllOfficers] Adding officer from localStorage: ${localOfficer.username}`);
          // Make sure the officer has password field for login
          if (!localOfficer.password) {
            localOfficer.password = 'tender00';
          }
          officers.push(localOfficer);
        }
      }
      
      // Update localStorage with the combined list
      // IMPORTANT: Always update localStorage, even if officers list is empty
      // This prevents data loss when the application restarts
      localStorage.setItem(localStorageKeys.officers, JSON.stringify(officers));
      (window as any).officerTempStore = officers;
      
      // Also ensure we persist the officers to the trustchain_users localStorage
      // This provides additional redundancy for officer data
      try {
        const trustchainUsers = JSON.parse(localStorage.getItem('trustchain_users') || '[]');
        const adminUser = trustchainUsers.find((u: any) => u.username === 'admin');
        
        // Convert officers to the format expected by trustchain_users
        const officerUsers = officers.map((officer: Officer) => ({
          id: officer.id,
          name: officer.name,
          username: officer.username,
          email: officer.email,
          role: 'officer' as UserRole,
          walletAddress: officer.walletAddress,
          createdAt: officer.createdAt,
          isApproved: officer.permissions?.isActive || true,
          approvalRemark: '',
          permissions: officer.permissions || { canCreate: true, canApprove: true, isActive: true }
        }));
        
        // Create updated users list with admin + officers
        const updatedUsers = adminUser ? [adminUser, ...officerUsers] : officerUsers;
        localStorage.setItem('trustchain_users', JSON.stringify(updatedUsers));
        
        // Also update password map
        const passwordMap = JSON.parse(localStorage.getItem('trustchain_passwords') || '{}');
        for (const officer of officers) {
          passwordMap[officer.username] = officer.password || 'tender00';
        }
        localStorage.setItem('trustchain_passwords', JSON.stringify(passwordMap));
        
        console.log(`[getAllOfficers] Updated trustchain_users with ${officerUsers.length} officers`);
      } catch (err) {
        console.warn('[getAllOfficers] Error updating trustchain_users:', err);
      }
      
      console.log(`[getAllOfficers] Retrieved ${officers.length} officers successfully`);
      return officers;
    } catch (error) {
      console.error("Error getting officers from contract:", error);
      // Fallback to localStorage if contract call fails
      console.log(`[getAllOfficers] Falling back to ${localOfficers.length} officers from localStorage`);
      return localOfficers;
    }
  };

  const fetchTenders = async (): Promise<FormattedTender[]> => {
    try {
      if (!tenderContract) {
        console.warn("[fetchTenders] No tender contract available, returning empty list");
        return [];
      }
      // Check if contract is properly initialized by calling a simple method
      try {
        await tenderContract.address; // Basic check to see if contract object is valid
      } catch (contractError) {
        console.error("[fetchTenders] Contract object invalid, skipping blockchain call:", contractError);
        return [];
      }
      let tenderIds = [];
      try {
        tenderIds = await tenderContract.getAllTenderIds();
        console.log("[fetchTenders] Retrieved tender IDs:", tenderIds);
      } catch (idError) {
        console.error("[fetchTenders] Failed to get tender IDs, falling back to empty list:", idError);
        return [];
      }
      const tenders = await Promise.all(
        tenderIds.map(async (id) => {
          try {
            const tender = await tenderContract.tenders(id);
            const highestBid = await tenderContract.getHighestBid(id);
            return {
              id: id.toNumber(),
              title: tender.title,
              description: tender.description,
              documentCid: tender.documentCid,
              budget: ethers.utils.formatEther(tender.budget),
              deadline: new Date(tender.deadline.toNumber() * 1000),
              creator: tender.creator || "",
              status: tender.status || "",
              createdAt: tender.createdAt ? new Date(tender.createdAt.toNumber() * 1000) : new Date(),
              isActive: tender.isActive,
              highestBid: highestBid ? ethers.utils.formatEther(highestBid.amount) : "0",
              highestBidder: highestBid ? highestBid.bidder : "",
            };
          } catch (tenderError) {
            console.error(`[fetchTenders] Error fetching tender ID ${id}:`, tenderError);
            return null;
          }
        })
      );
      // Filter out any null results from failed tender fetches
      return tenders.filter(tender => tender !== null);
    } catch (error) {
      console.error("[fetchTenders] General error fetching tenders (fallback to empty):", error);
      return [];
    }
  };

  const createNewTender = async (data: { title: string; description: string; department: string; budget: string; deadline: number; criteria: string[]; documents: { name: string; size: string }[] }): Promise<string> => {
    try {
      // Ensure wallet connected
      if (!tenderContract || !signer) {
        const connected = await connectWallet();
        if (!connected || !tenderContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }
      const { title, description, department, budget, deadline } = data;
      // Generate a simple ID
      const id = `${Date.now()}`;
      const documentCid = ""; // Replace with real CID after IPFS upload
      const budgetWei = ethers.utils.parseEther(budget);
      const tx = await tenderContract.createTender(id, title, description, documentCid, budgetWei, deadline);
      await tx.wait();
      toast({ title: "Tender Created", description: `Tender ${id} created successfully` });
      return id;
    } catch (error: any) {
      console.error("Error creating tender:", error);
      toast({ title: "Error", description: error.message || "Failed to create tender", variant: "destructive" });
      throw error;
    }
  };

  // Register a new user on the blockchain
  const registerUser = async (userData: { name: string; username: string; email: string; companyName: string; walletAddress: string }): Promise<boolean> => {
    console.log("[registerUser] Starting user registration on blockchain", userData);
    try {
      // Ensure wallet is connected
      if (!userAuthContract || !signer) {
        console.log("[registerUser] Wallet not connected, connecting...");
        const connected = await connectWallet();
        console.log("[registerUser] connectWallet result:", connected);
        if (!connected || !userAuthContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }

      if (!account) {
        throw new Error("No wallet account connected");
      }

      console.log("[registerUser] Wallet connected, account:", account);
      console.log("[registerUser] userAuthContract:", userAuthContract);

      // Generate a unique ID for the user
      const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      console.log("[registerUser] Generated userId:", userId);
      
      try {
        // Call the smart contract to register the user
        console.log("[registerUser] Calling smart contract with params:", {
          walletAddress: userData.walletAddress,
          userId,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: "bidder",
          companyName: userData.companyName
        });
        
        // Call the registerUser function on the smart contract
        const tx = await userAuthContract.registerUser(
          userData.walletAddress,
          userId,
          userData.name,
          userData.username,
          userData.email,
          "bidder",
          userData.companyName,
          "", // Additional fields can be empty for now
          "",
          "",
          0,
          "",
          "",
          "",
          "",
          "Indian"
        );
        
        console.log("[registerUser] Transaction sent:", tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("[registerUser] Transaction confirmed:", receipt.transactionHash);
        
        toast({
          title: "Success",
          description: "User registered on blockchain successfully!",
        });
        
        return true;
      } catch (err) {
        console.error("[registerUser] Transaction failed:", err);
        throw new Error(`Failed to register user on blockchain: ${err.message}`);
      }
    } catch (error: any) {
      console.error("[registerUser] Error registering user:", error);
      toast({
        title: "Registration Error",
        description: error.message || "Failed to register user on blockchain",
        variant: "destructive",
      });
      return false;
    }
  };

  const loadContracts = async (provider: ethers.providers.Web3Provider, signer: ethers.Signer) => {
    try {
      // Initialize contracts
      const officerContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.OFFICER_MANAGEMENT,
        CONTRACT_ABI.OFFICER_MANAGEMENT,
        signer
      );
      console.debug('[Web3Context] officerContract initialized at', CONTRACT_ADDRESSES.OFFICER_MANAGEMENT);
      setOfficerContract(officerContractInstance);

      const userAuthContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.USER_AUTHENTICATION,
        CONTRACT_ABI.USER_AUTHENTICATION,
        signer
      );
      setUserAuthContract(userAuthContractInstance);

      const tenderContractInstance = new ethers.Contract(
        CONTRACT_ADDRESSES.TENDER_MANAGEMENT,
        CONTRACT_ABI.TENDER_MANAGEMENT,
        signer
      );
      setTenderContract(tenderContractInstance);
    } catch (error) {
      console.error("Error loading contracts:", error);
      setError(error.message || "Failed to load contracts");
    }
  };

  const value: Web3ContextType = {
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
    registerUser,
    createNewTender,
    fetchTenders,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export { useWeb3, Web3ProviderComponent as Web3Provider };