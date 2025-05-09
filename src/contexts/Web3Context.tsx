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
    if (isConnecting.current) return false; // Prevent multiple requests

    if (typeof window.ethereum === 'undefined') {
      setError("MetaMask is not installed. Please install MetaMask to use this application.");
      console.error("MetaMask is not installed");
      return false;
    }

    isConnecting.current = true;
    setError(null);

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        setError("No accounts found. Please check MetaMask.");
        return false;
      }

      const address = accounts[0];
      handleWalletConnection(web3Provider, address);
      return true;
    } catch (error: any) {
      setError(error.message || "Failed to connect wallet");
      console.error("Error connecting wallet:", error);
      return false;
    } finally {
      isConnecting.current = false;
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
    try {
      if (!officerContract || !signer) {
        const connected = await connectWallet();
        if (!connected || !officerContract) {
          throw new Error("Contract or signer not initialized. Please connect your wallet first.");
        }
      }

      if (!account) {
        throw new Error("No wallet account connected");
      }

      // Check if officer already exists
      const existingOfficer = await getOfficer(account);
      if (existingOfficer && existingOfficer.id && existingOfficer.id !== "") {
        toast({
          title: "Error",
          description: "Officer already exists for this address.",
          variant: "destructive",
        });
        return false;
      }

      // Generate a unique ID for the officer
      const id = `officer-${Date.now()}`;

      // Add officer to contract with all required parameters
      const tx = await officerContract.addOfficer(account, id, name, username, email);
      await tx.wait();

      toast({
        title: "Success",
        description: `Officer ${username} added successfully`,
      });

      return true;
    } catch (error: any) {
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
      let id, name, username, email, isActive, createdAt;
      try {
        [id, name, username, email, isActive, createdAt] = await officerContract.getOfficer(walletAddress);
      } catch (err) {
        // If call reverts or overflows, treat as officer not found
        console.warn(`getOfficer: contract call failed for ${walletAddress}:`, err);
        return null;
      }
      const officerId = id?.toString?.() ?? "";
      const createdAtStr = createdAt?.toString?.() ?? "0";
      const createdAtNum = Number(createdAtStr);
      if (!officerId || officerId === "" || !Number.isFinite(createdAtNum) || createdAtNum === 0) {
        return null;
      }
      return {
        id: officerId,
        walletAddress,
        name: name.toString(),
        username: username.toString(),
        email: email.toString(),
        isActive: Boolean(isActive),
        permissions: {
          canCreate: Boolean(isActive),
          canApprove: Boolean(isActive),
          isActive: Boolean(isActive)
        },
        createdAt: new Date(createdAtNum * 1000)
      };
    } catch (error) {
      console.error("Error getting officer (outer):", error);
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
          let id, name, username, email, isActive, createdAt;
          try {
            [id, name, username, email, isActive, createdAt] = await officerContract.getOfficer(address);
          } catch (err) {
            // If call reverts or overflows, skip this officer
            console.warn(`getAllOfficers: contract call failed for ${address}:`, err);
            continue;
          }
          const officerId = id?.toString?.() ?? "";
          const createdAtStr = createdAt?.toString?.() ?? "0";
          const createdAtNum = Number(createdAtStr);
          if (!officerId || officerId === "" || !Number.isFinite(createdAtNum) || createdAtNum === 0) {
            continue;
          }
          const officer: Officer = {
            id: officerId,
            walletAddress: address,
            name: name.toString(),
            username: username.toString(),
            email: email.toString(),
            isActive: Boolean(isActive),
            permissions: {
              canCreate: Boolean(isActive),
              canApprove: Boolean(isActive),
              isActive: Boolean(isActive)
            },
            createdAt: new Date(createdAtNum * 1000)
          };
          officers.push(officer);
        } catch (err) {
          console.error(`Error fetching officer ${address} (outer):`, err);
        }
      }

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