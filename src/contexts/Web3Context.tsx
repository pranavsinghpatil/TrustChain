import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import TenderContract from '../contracts/Tender.json';

// Define more comprehensive types for blockchain data
export interface Tender {
  id: number;
  title: string;
  description: string;
  budget: string;
  deadline: number;
  creator: string;
  department: string;
  isActive: boolean;
  winner: string;
  bidCount: number;
  status: 'open' | 'closed' | 'awarded' | 'disputed';
  createdAt: number;
  awardedAt?: number;
  closedAt?: number;
  disputedAt?: number;
  disputed: boolean;
  criteria: string[];
  documents?: { name: string; size: string }[];
}

export interface Bid {
  bidder: string;
  amount: string;
  timestamp: number;
  description: string;
}

// Interface for creating a new tender
export interface NewTenderData {
  title: string;
  description: string;
  budget: string;
  deadline: number;
  department: string;
  criteria: string[];
  documents?: { name: string; size: string }[];
}

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  account: string | null;
  connectWallet: () => Promise<boolean>;
  isConnected: boolean;
  fetchTenders: () => Promise<Tender[]>;
  fetchTenderById: (id: number) => Promise<Tender | null>;
  fetchBidsForTender: (tenderId: number) => Promise<Bid[]>;
  createNewTender: (tenderData: NewTenderData) => Promise<number>;
  submitBid: (tenderId: number, amount: string, description: string) => Promise<boolean>;
  awardTender: (tenderId: number, winnerAddress: string) => Promise<boolean>;
  closeTender: (tenderId: number) => Promise<boolean>;
  disputeTender: (tenderId: number, reason?: string) => Promise<boolean>;
  networkName: string;
  contractAddress: string;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  contract: null,
  account: null,
  connectWallet: async () => false,
  isConnected: false,
  fetchTenders: async () => [],
  fetchTenderById: async () => null,
  fetchBidsForTender: async () => [],
  createNewTender: async () => 0,
  submitBid: async () => false,
  awardTender: async () => false,
  closeTender: async () => false,
  disputeTender: async () => false,
  networkName: '',
  contractAddress: '',
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';

  const connectWallet = async (): Promise<boolean> => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Request accounts access
        const accounts = await provider.send("eth_requestAccounts", []);
        
        const signer = provider.getSigner();
        const account = await signer.getAddress();
        
        // Get network information
        const network = await provider.getNetwork();
        setNetworkName(network.name === 'unknown' ? 'Local Hardhat' : network.name);
        
        const contract = new ethers.Contract(
          contractAddress,
          TenderContract.abi,
          signer
        );

        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(account);
        setIsConnected(true);
        
        return true;
      } else {
        console.error('Please install MetaMask!');
        return false;
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      return false;
    }
  };

  // Fetch all tenders from the blockchain
  const fetchTenders = async (): Promise<Tender[]> => {
    if (!contract) {
      if (!await connectWallet()) return [];
    }
    
    try {
      const tenderCount = await contract!.tenderCount();
      const tenders: Tender[] = [];
      
      for (let i = 0; i < tenderCount.toNumber(); i++) {
        const [id, creator, title, description, department, budget, deadline, isActive, winner] = await contract!.getTender(i);
        const bidCount = await contract!.getBidsCount(i);
        
        let status: 'open' | 'closed' | 'awarded' | 'disputed' = 'closed';
        
        if (isActive) {
          status = 'open';
        } else if (winner !== ethers.constants.AddressZero) {
          status = 'awarded';
        }
        
        // Check if disputed (in a real contract, this would be a property of the tender)
        const disputed = false; // Placeholder, would come from contract
        if (disputed) {
          status = 'disputed';
        }
        
        // Mock creation timestamp (in a real contract, this would be stored)
        const now = Math.floor(Date.now() / 1000);
        const createdAt = now - 86400 * 7; // 7 days ago
        
        // Mock criteria (in a real contract, this would be stored)
        const criteria = [
          'Technical expertise',
          'Cost-effectiveness',
          'Timeline',
          'Previous experience'
        ];
        
        tenders.push({
          id: id.toNumber(),
          creator,
          title,
          description,
          department,
          budget: ethers.utils.formatEther(budget),
          deadline: deadline.toNumber(),
          isActive,
          winner,
          bidCount: bidCount.toNumber(),
          status,
          createdAt,
          disputed,
          criteria,
          // Optional fields that would be set based on status
          ...(status === 'awarded' && { awardedAt: now - 86400 }),
          ...(status === 'closed' && { closedAt: now - 86400 * 2 }),
          ...(status === 'disputed' && { disputedAt: now - 86400 * 3 })
        });
      }
      
      return tenders;
    } catch (error) {
      console.error('Error fetching tenders:', error);
      return [];
    }
  };

  // Fetch a specific tender by ID
  const fetchTenderById = async (id: number): Promise<Tender | null> => {
    if (!contract) {
      if (!await connectWallet()) return null;
    }
    
    try {
      const [tenderId, creator, title, description, department, budget, deadline, isActive, winner] = await contract!.getTender(id);
      const bidCount = await contract!.getBidsCount(id);
      
      let status: 'open' | 'closed' | 'awarded' | 'disputed' = 'closed';
      
      if (isActive) {
        status = 'open';
      } else if (winner !== ethers.constants.AddressZero) {
        status = 'awarded';
      }
      
      // Check if disputed (in a real contract, this would be a property of the tender)
      const disputed = false; // Placeholder, would come from contract
      if (disputed) {
        status = 'disputed';
      }
      
      // Mock creation timestamp (in a real contract, this would be stored)
      const now = Math.floor(Date.now() / 1000);
      const createdAt = now - 86400 * 7; // 7 days ago
      
      // Mock criteria (in a real contract, this would be stored)
      const criteria = [
        'Technical expertise',
        'Cost-effectiveness',
        'Timeline',
        'Previous experience'
      ];
      
      // Mock documents (in a real contract, these would be IPFS hashes)
      const documents = [
        { name: 'Technical_Requirements.pdf', size: '2.4 MB' },
        { name: 'Legal_Terms.pdf', size: '1.1 MB' }
      ];
      
      return {
        id: tenderId.toNumber(),
        creator,
        title,
        description,
        department,
        budget: ethers.utils.formatEther(budget),
        deadline: deadline.toNumber(),
        isActive,
        winner,
        bidCount: bidCount.toNumber(),
        status,
        createdAt,
        disputed,
        criteria,
        documents,
        // Optional fields that would be set based on status
        ...(status === 'awarded' && { awardedAt: now - 86400 }),
        ...(status === 'closed' && { closedAt: now - 86400 * 2 }),
        ...(status === 'disputed' && { disputedAt: now - 86400 * 3 })
      };
    } catch (error) {
      console.error(`Error fetching tender ID ${id}:`, error);
      return null;
    }
  };

  // Fetch all bids for a specific tender
  const fetchBidsForTender = async (tenderId: number): Promise<Bid[]> => {
    if (!contract) {
      if (!await connectWallet()) return [];
    }
    
    try {
      const bidCount = await contract!.getBidsCount(tenderId);
      const bids: Bid[] = [];
      
      for (let i = 0; i < bidCount.toNumber(); i++) {
        const [bidder, amount, timestamp, description] = await contract!.getBid(tenderId, i);
        
        bids.push({
          bidder,
          amount: ethers.utils.formatEther(amount),
          timestamp: timestamp.toNumber(),
          description
        });
      }
      
      return bids;
    } catch (error) {
      console.error(`Error fetching bids for tender ID ${tenderId}:`, error);
      return [];
    }
  };

  // Create a new tender
  const createNewTender = async (tenderData: NewTenderData): Promise<number> => {
    if (!contract) {
      if (!await connectWallet()) return 0;
    }
    
    try {
      const budgetInWei = ethers.utils.parseEther(tenderData.budget);
      const tx = await contract!.createTender(
        tenderData.title,
        tenderData.description,
        tenderData.department,
        budgetInWei,
        tenderData.deadline
      );
      
      const receipt = await tx.wait();
      
      // In a real implementation, we would extract the tender ID from the event
      // For now, we'll just return the current tender count as the new ID
      const tenderCount = await contract!.tenderCount();
      return tenderCount.toNumber() - 1;
    } catch (error) {
      console.error('Error creating tender:', error);
      return 0;
    }
  };

  // Submit a bid for a tender
  const submitBid = async (
    tenderId: number, 
    amount: string,
    description: string
  ): Promise<boolean> => {
    if (!contract) {
      if (!await connectWallet()) return false;
    }
    
    try {
      const amountInWei = ethers.utils.parseEther(amount);
      const tx = await contract!.placeBid(
        tenderId,
        amountInWei,
        description
      );
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error(`Error submitting bid for tender ID ${tenderId}:`, error);
      return false;
    }
  };

  // Award a tender to a specific bidder
  const awardTender = async (
    tenderId: number,
    winnerAddress: string
  ): Promise<boolean> => {
    if (!contract) {
      if (!await connectWallet()) return false;
    }
    
    try {
      const tx = await contract!.awardTender(
        tenderId,
        winnerAddress
      );
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error(`Error awarding tender ID ${tenderId}:`, error);
      return false;
    }
  };

  // Close a tender without awarding
  const closeTender = async (tenderId: number): Promise<boolean> => {
    if (!contract) {
      if (!await connectWallet()) return false;
    }
    
    try {
      const tx = await contract!.closeTender(tenderId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error(`Error closing tender ID ${tenderId}:`, error);
      return false;
    }
  };

  // Raise a dispute for a tender
  const disputeTender = async (
    tenderId: number,
    reason: string = "Dispute raised"
  ): Promise<boolean> => {
    if (!contract) {
      if (!await connectWallet()) return false;
    }
    
    try {
      const tx = await contract!.disputeTender(
        tenderId,
        reason
      );
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error(`Error disputing tender ID ${tenderId}:`, error);
      return false;
    }
  };

  useEffect(() => {
    // Try to connect automatically if previously connected
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          // Check if there are already connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error("Error auto-connecting:", error);
        }
      }
    };
    
    autoConnect();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false);
          setAccount(null);
        } else {
          // Account changed, reconnect
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        connectWallet,
        isConnected,
        fetchTenders,
        fetchTenderById,
        fetchBidsForTender,
        createNewTender,
        submitBid,
        awardTender,
        closeTender,
        disputeTender,
        networkName,
        contractAddress
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};