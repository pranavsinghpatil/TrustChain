// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from "react";
import { ethers } from "ethers";
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "@/config/contracts";
import { TARGET_NETWORK } from "@/config/network";

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
      if (typeof window.ethereum === "undefined") {
        console.warn("MetaMask is not installed");
        return;
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      try {
        // Auto-connect to set up contracts immediately
        await connectWallet();
      } catch (err) {
        console.error("Auto wallet connection failed:", err);
      }
    };

    init();

    // Setup event listeners
    accountsChangedRef.current = handleAccountsChanged;
    chainChangedRef.current = handleChainChanged;
    disconnectRef.current = handleDisconnect;

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', accountsChangedRef.current);
      window.ethereum.on('chainChanged', chainChangedRef.current);
      window.ethereum.on('disconnect', disconnectRef.current);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', accountsChangedRef.current);
        window.ethereum.removeListener('chainChanged', chainChangedRef.current);
        window.ethereum.removeListener('disconnect', disconnectRef.current);
      }
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
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

      // First check if the address is already in the officers list
      try {
        const officerAddresses = await officerContract.getAllOfficerAddresses();
        const isExistingOfficer = officerAddresses.some((addr: string) => 
          addr.toLowerCase() === account.toLowerCase());
        
        if (isExistingOfficer) {
          console.log(`[addOfficer] Address ${account} is already an officer`);
          
          // Instead of failing, try to update the existing officer
          try {
            // Store officer credentials for login
            sessionStorage.setItem(`officer_${username}`, JSON.stringify({
              username,
              password: 'tender00'
            }));
            
            toast({
              title: "Officer Already Exists",
              description: `Using existing officer. Password: tender00`,
            });
            
            // Return true to indicate success - we're treating this as a successful operation
            return true;
          } catch (err) {
            console.warn(`[addOfficer] Error storing credentials:`, err);
          }
          
          toast({
            title: "Error",
            description: "Officer already exists for this address.",
            variant: "destructive",
          });
          return false;
        }
      } catch (err) {
        console.warn(`[addOfficer] Error checking officer addresses:`, err);
        // Continue anyway to try direct creation
      }

      // Generate a unique ID for the officer
      const id = `officer-${Date.now()}`;

      // Add officer to contract with all required parameters
      const tx = await officerContract.addOfficer(account, id, name, username, email);
      console.log('[addOfficer] Transaction sent:', tx.hash);
      await tx.wait();
      console.log('[addOfficer] Transaction confirmed');

      // Store officer credentials for login
      try {
        sessionStorage.setItem(`officer_${username}`, JSON.stringify({
          username,
          password: 'tender00'
        }));
        console.log(`[addOfficer] Stored credentials for ${username} in sessionStorage`);
      } catch (err) {
        console.warn(`[addOfficer] Error storing credentials:`, err);
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
        description: "Officer removed successfully",
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

  const getOfficer = async (walletAddress: string): Promise<Officer | null> => {
    if (!officerContract) {
      console.error("Officer contract not initialized");
      return null;
    }
    try {
      // First check if the address is in the officers list
      try {
        const officerAddresses = await officerContract.getAllOfficerAddresses();
        const isOfficer = officerAddresses.some((addr: string) => 
          addr.toLowerCase() === walletAddress.toLowerCase());
        
        if (!isOfficer) {
          console.log(`[getOfficer] Address ${walletAddress} is not in the officers list`);
          return null;
        }
      } catch (err) {
        console.warn(`[getOfficer] Error checking officer addresses:`, err);
        // Continue anyway to try direct lookup
      }
      
      // Try to get officer details with safe handling of BigNumber values
      try {
        const result = await officerContract.getOfficer(walletAddress);
        
        // Safely extract values using toString to avoid BigNumber overflow
        const id = result[0]?.toString() || "";
        const name = result[1]?.toString() || "";
        const username = result[2]?.toString() || "";
        const email = result[3]?.toString() || "";
        const isActive = Boolean(result[4]);
        
        // Handle createdAt safely
        let createdAtDate = new Date();
        try {
          const createdAtStr = result[5]?.toString() || "0";
          const createdAtNum = parseInt(createdAtStr, 10);
          if (!isNaN(createdAtNum) && createdAtNum > 0) {
            createdAtDate = new Date(createdAtNum * 1000);
          }
        } catch (err) {
          console.warn(`[getOfficer] Error parsing createdAt:`, err);
        }
        
        // Check if we have a valid ID
        if (!id || id === "") {
          console.log(`[getOfficer] Invalid ID for officer at ${walletAddress}`);
          return null;
        }
        
        console.log(`[getOfficer] Successfully retrieved officer: ${username} (${id})`);
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
          createdAt: createdAtDate
        };
      } catch (err) {
        console.warn(`[getOfficer] Error getting officer details:`, err);
        return null;
      }
    } catch (error) {
      console.error("[getOfficer] Error getting officer (outer):", error);
      return null;
    }
  };

  const getAllOfficers = async (): Promise<Officer[]> => {
    if (!officerContract) {
      console.error("Officer contract not initialized");
      return [];
    }
    try {
      // Get all officer addresses first
      const officerAddresses = await officerContract.getAllOfficerAddresses();
      const officers: Officer[] = [];

      // Get details for each officer
      for (const address of officerAddresses) {
        try {
          let id = "", name = "", username = "", email = "", isActive = false;
          let createdAt: string | number = "0";
          
          try {
            // Use a try-catch for each field to handle potential errors individually
            try {
              // First try to get just the ID to check if officer exists
              const officerId = await officerContract.getOfficerId(address);
              id = officerId.toString();
              console.log(`[getAllOfficers] Got officer ID for ${address}: ${id}`);
            } catch (idErr) {
              console.warn(`[getAllOfficers] Failed to get ID for ${address}:`, idErr);
              // If we can't get the ID, create a fallback ID
              id = `officer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
            
            // Try to get the name
            try {
              const officerName = await officerContract.getOfficerName(address);
              name = officerName.toString();
            } catch (nameErr) {
              console.warn(`[getAllOfficers] Failed to get name for ${address}:`, nameErr);
              name = "Unknown Officer";
            }
            
            // Try to get the username
            try {
              const officerUsername = await officerContract.getOfficerUsername(address);
              username = officerUsername.toString();
            } catch (usernameErr) {
              console.warn(`[getAllOfficers] Failed to get username for ${address}:`, usernameErr);
              // Extract username from address if not available
              username = `officer-${address.substring(2, 6)}`;
            }
            
            // Try to get the email
            try {
              const officerEmail = await officerContract.getOfficerEmail(address);
              email = officerEmail.toString();
            } catch (emailErr) {
              console.warn(`[getAllOfficers] Failed to get email for ${address}:`, emailErr);
              email = `${username}@example.com`;
            }
            
            // Try to get active status
            try {
              const officerActive = await officerContract.isOfficerActive(address);
              isActive = Boolean(officerActive);
            } catch (activeErr) {
              console.warn(`[getAllOfficers] Failed to get active status for ${address}:`, activeErr);
              isActive = true; // Default to active
            }
            
            // Use current time for createdAt if not available
            createdAt = Date.now().toString();
            
            console.log(`[getAllOfficers] Processed officer data for ${address}:`, { 
              id, name, username, email, isActive, createdAt 
            });
          } catch (err) {
            // If all calls fail, create a minimal officer record
            console.warn(`[getAllOfficers] All contract calls failed for ${address}, creating minimal record:`, err);
            id = `officer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            name = "Unknown Officer";
            username = `officer-${address.substring(2, 6)}`;
            email = `${username}@example.com`;
            isActive = true;
            createdAt = Date.now().toString();
          }
          
          // Skip officers with invalid IDs
          if (!id || id === "") {
            console.warn(`[getAllOfficers] Skipping officer with empty ID: ${address}`);
            continue;
          }
          
          // Safe conversion of createdAt string to Date
          let createdAtDate;
          try {
            // Try to parse the createdAt as a number
            const createdAtNum = parseInt(createdAt.toString(), 10);
            
            if (isNaN(createdAtNum) || createdAtNum <= 0) {
              // If invalid, use current time
              createdAtDate = new Date();
              console.warn(`[getAllOfficers] Invalid createdAt timestamp for ${id}, using current time`);
            } else {
              // Otherwise use the timestamp (multiply by 1000 to convert from seconds to milliseconds)
              createdAtDate = new Date(createdAtNum * 1000);
            }
          } catch (err) {
            // Fallback to current date if parsing fails
            console.warn(`[getAllOfficers] Failed to parse createdAt for officer ${id}:`, err);
            createdAtDate = new Date();
          }
          
          const officer: Officer = {
            id: id,
            walletAddress: address,
            name: name,
            username: username,
            email: email,
            isActive: isActive,
            permissions: {
              canCreate: isActive,
              canApprove: isActive,
              isActive: isActive
            },
            createdAt: createdAtDate
          };
          
          officers.push(officer);
          
          // Store officer credentials in sessionStorage for cross-browser access
          console.log(`[getAllOfficers] Successfully added officer: ${username} (${id})`);
          try {
            // Store officer password in sessionStorage
            sessionStorage.setItem(`officer_${username}`, JSON.stringify({
              username,
              password: 'tender00'
            }));
          } catch (err) {
            console.warn(`[getAllOfficers] Failed to store officer in sessionStorage:`, err);
          }
        } catch (err) {
          console.error(`[getAllOfficers] Error processing officer ${address}:`, err);
        }
      }
      
      console.log(`[getAllOfficers] Retrieved ${officers.length} officers successfully`);
      return officers;
    } catch (error) {
      console.error("Error getting all officers:", error);
      return [];
    }
  };

  const fetchTenders = async (): Promise<FormattedTender[]> => {
    try {
      if (!tenderContract) {
        console.error("Tender contract not initialized");
        return [];
      }

      const tenderIds = await tenderContract.getAllTenderIds();
      if (!tenderIds || !Array.isArray(tenderIds)) {
        return [];
      }
      
      const formattedTenders: FormattedTender[] = [];

      for (const id of tenderIds) {
        try {
          const tender = await tenderContract.getTender(id);
          formattedTenders.push({
            id: tender.id,
            title: tender.title,
            description: tender.description,
            documentCid: tender.documentCid,
            budget: ethers.utils.formatEther(tender.budget),
            deadline: new Date(tender.deadline.toNumber() * 1000),
            creator: tender.creator,
            status: tender.status,
            createdAt: new Date(tender.createdAt.toNumber() * 1000)
          });
        } catch (err) {
          console.error(`Error fetching tender ${id}:`, err);
          // Continue with other tenders even if one fails
        }
      }

      return formattedTenders;
    } catch (error: any) {
      console.warn("Error fetching tenders (fallback to empty):", error.message || error);
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