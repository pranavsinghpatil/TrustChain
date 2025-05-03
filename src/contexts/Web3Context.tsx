import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { 
  getOfficerManagementContract, 
  IOfficerManagement,
  CONTRACT_ADDRESSES
} from "@/contracts/interfaces/contracts";

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<boolean>;
  officerContract: IOfficerManagement | null;
  addOfficer: (id: string, name: string, username: string, email: string) => Promise<boolean>;
  updateOfficer: (walletAddress: string, name: string, username: string, email: string) => Promise<boolean>;
  removeOfficer: (walletAddress: string) => Promise<boolean>;
  getOfficer: (walletAddress: string) => Promise<any>;
  getAllOfficers: () => Promise<any[]>;
  isLoading: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

// Target network configuration
const TARGET_NETWORK = {
  chainId: 11155111, // Sepolia testnet
  name: "Sepolia",
  rpcUrl: "https://sepolia.infura.io/v3/your-infura-key", // Replace with your Infura key
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [officerContract, setOfficerContract] = useState<IOfficerManagement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Initialize provider and check connection on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== "undefined") {
          // Create a Web3Provider from MetaMask
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          // Check if already connected
          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            setAccount(currentAccount);
            setIsConnected(true);
            
            // Get signer
            const web3Signer = web3Provider.getSigner();
            setSigner(web3Signer);
            
            // Get network
            const network = await web3Provider.getNetwork();
            setChainId(network.chainId);
            setIsCorrectNetwork(network.chainId === TARGET_NETWORK.chainId);
            
            // Initialize contracts
            initializeContracts(web3Provider, web3Signer);
          }
        }
      } catch (error) {
        console.error("Error initializing Web3:", error);
      }
    };
    
    init();
    
    // Setup event listeners for account and chain changes
    if (typeof window.ethereum !== "undefined") {
      const ethereum = window.ethereum as any;
      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);
    }
    
    return () => {
      // Cleanup event listeners
      if (typeof window.ethereum !== "undefined") {
        const ethereum = window.ethereum as any;
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);
  
  // Initialize contract instances
  const initializeContracts = (
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer
  ) => {
    try {
      // Initialize OfficerManagement contract
      const officerMgmtContract = getOfficerManagementContract(provider, signer);
      setOfficerContract(officerMgmtContract);
      
      // Initialize other contracts as needed
    } catch (error) {
      console.error("Error initializing contracts:", error);
      setError("Failed to initialize blockchain contracts");
    }
  };
  
  // Handle account changes in MetaMask
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      // Account changed
      setAccount(accounts[0]);
      setIsConnected(true);
      
      // Re-initialize contracts with new signer if provider exists
      if (provider) {
        const newSigner = provider.getSigner();
        setSigner(newSigner);
        initializeContracts(provider, newSigner);
      }
    }
  };
  
  // Handle chain/network changes in MetaMask
  const handleChainChanged = (chainIdHex: string) => {
    // MetaMask provides chainId as a hex string
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    setIsCorrectNetwork(newChainId === TARGET_NETWORK.chainId);
    
    // Reload the page as recommended by MetaMask
    window.location.reload();
  };

  // Connect wallet function
  const connectWallet = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (typeof window.ethereum === "undefined") {
        console.error("MetaMask is not installed");
        setError("MetaMask is not installed. Please install MetaMask to connect your wallet.");
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to connect your wallet",
          variant: "destructive",
        });
        return false;
      }
      
      // Request account access
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      if (accounts.length === 0) {
        setError("No accounts found. Please create an account in MetaMask.");
        return false;
      }
      
      // Set account and connection status
      setAccount(accounts[0]);
      setIsConnected(true);
      setProvider(web3Provider);
      
      // Get signer
      const web3Signer = web3Provider.getSigner();
      setSigner(web3Signer);
      
      // Get network
      const network = await web3Provider.getNetwork();
      setChainId(network.chainId);
      setIsCorrectNetwork(network.chainId === TARGET_NETWORK.chainId);
      
      // Initialize contracts
      initializeContracts(web3Provider, web3Signer);
      
      console.log("Wallet connected:", accounts[0]);
      
      // If not on the correct network, prompt to switch
      if (network.chainId !== TARGET_NETWORK.chainId) {
        toast({
          title: "Network Mismatch",
          description: `Please switch to ${TARGET_NETWORK.name} network`,
          variant: "destructive",
        });
        await switchNetwork();
      }
      
      return true;
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Failed to connect wallet");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setSigner(null);
    setOfficerContract(null);
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
  const addOfficer = async (
    id: string,
    name: string,
    username: string,
    email: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!officerContract || !account) {
        setError("Wallet not connected or contract not initialized");
        return false;
      }
      
      // Get the wallet address to assign to the officer
      // In a real implementation, this would be the officer's own wallet
      // For now, we'll use the connected wallet address
      const walletAddress = account;
      
      // Call the contract method
      const tx = await officerContract.addOfficer(
        walletAddress,
        id,
        name,
        username,
        email || ""
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      toast({
        title: "Officer Added",
        description: `${name} has been added to the blockchain`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error adding officer to blockchain:", error);
      setError(error.message || "Failed to add officer to blockchain");
      
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to add officer to blockchain",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update an officer on the blockchain
  const updateOfficer = async (
    walletAddress: string,
    name: string,
    username: string,
    email: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!officerContract) {
        setError("Contract not initialized");
        return false;
      }
      
      // Call the contract method
      const tx = await officerContract.updateOfficer(
        walletAddress,
        name,
        username,
        email || ""
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      toast({
        title: "Officer Updated",
        description: `${name}'s information has been updated on the blockchain`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating officer on blockchain:", error);
      setError(error.message || "Failed to update officer on blockchain");
      
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to update officer on blockchain",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove an officer from the blockchain
  const removeOfficer = async (walletAddress: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!officerContract) {
        setError("Contract not initialized");
        return false;
      }
      
      // Call the contract method
      const tx = await officerContract.removeOfficer(walletAddress);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      toast({
        title: "Officer Removed",
        description: "Officer has been removed from the blockchain",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error removing officer from blockchain:", error);
      setError(error.message || "Failed to remove officer from blockchain");
      
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to remove officer from blockchain",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get officer details from the blockchain
  const getOfficer = async (walletAddress: string) => {
    try {
      if (!officerContract) {
        setError("Contract not initialized");
        return null;
      }
      
      const officerData = await officerContract.getOfficer(walletAddress);
      
      // Format the data
      return {
        id: officerData[0],
        name: officerData[1],
        username: officerData[2],
        email: officerData[3],
        isActive: officerData[4],
        createdAt: new Date(officerData[5].toNumber() * 1000),
        walletAddress: walletAddress,
      };
    } catch (error: any) {
      console.error("Error getting officer from blockchain:", error);
      setError(error.message || "Failed to get officer from blockchain");
      return null;
    }
  };
  
  // Get all officers from the blockchain
  const getAllOfficers = async () => {
    try {
      if (!officerContract) {
        setError("Contract not initialized");
        return [];
      }
      
      // Get all officer addresses
      const addresses = await officerContract.getAllOfficerAddresses();
      
      // Get details for each officer
      const officers = await Promise.all(
        addresses.map(async (address) => {
          return await getOfficer(address);
        })
      );
      
      return officers.filter(Boolean); // Filter out any null values
    } catch (error: any) {
      console.error("Error getting all officers from blockchain:", error);
      setError(error.message || "Failed to get officers from blockchain");
      return [];
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        isConnected,
        connectWallet,
        disconnectWallet,
        provider,
        signer,
        chainId,
        isCorrectNetwork,
        switchNetwork,
        officerContract,
        addOfficer,
        updateOfficer,
        removeOfficer,
        getOfficer,
        getAllOfficers,
        isLoading,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};