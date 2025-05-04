import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import DatabaseABI from '../artifacts/src/contracts/Database.sol/Database.json';
import OfficerManagementABI from '../artifacts/src/contracts/OfficerManagement.sol/OfficerManagement.json';
import UserAuthenticationABI from '../artifacts/src/contracts/UserAuthentication.sol/UserAuthentication.json';
import TenderManagementABI from '../artifacts/src/contracts/TenderManagement.sol/TenderManagement.json';
import BidManagementABI from '../artifacts/src/contracts/BidManagement.sol/BidManagement.json';

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  addOfficer: (walletAddress: string, id: string, name: string, username: string, email: string) => Promise<void>;
  updateOfficer: (walletAddress: string, name: string, username: string, email: string) => Promise<void>;
  removeOfficer: (walletAddress: string) => Promise<void>;
  getAllOfficers: () => Promise<any[]>;
  fetchTenders: () => Promise<any[]>;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Contract instances
  const [databaseContract, setDatabaseContract] = useState<ethers.Contract | null>(null);
  const [officerContract, setOfficerContract] = useState<ethers.Contract | null>(null);
  const [userAuthContract, setUserAuthContract] = useState<ethers.Contract | null>(null);
  const [tenderContract, setTenderContract] = useState<ethers.Contract | null>(null);
  const [bidContract, setBidContract] = useState<ethers.Contract | null>(null);

  const init = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const signer = provider.getSigner();
      setSigner(signer);

      // Initialize contracts with signer
      const database = new ethers.Contract(
        CONTRACT_ADDRESSES.database,
        DatabaseABI.abi,
        signer
      );
      setDatabaseContract(database);

      const officer = new ethers.Contract(
        CONTRACT_ADDRESSES.officerManagement,
        OfficerManagementABI.abi,
        signer
      );
      setOfficerContract(officer);

      const userAuth = new ethers.Contract(
        CONTRACT_ADDRESSES.userAuthentication,
        UserAuthenticationABI.abi,
        signer
      );
      setUserAuthContract(userAuth);

      const tender = new ethers.Contract(
        CONTRACT_ADDRESSES.tenderManagement,
        TenderManagementABI.abi,
        signer
      );
      setTenderContract(tender);

      const bid = new ethers.Contract(
        CONTRACT_ADDRESSES.bidManagement,
        BidManagementABI.abi,
        signer
      );
      setBidContract(bid);

      // Setup event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return true;
    } catch (error) {
      console.error("Error initializing provider:", error);
      return false;
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      await init();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask");
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        const success = await init();
        return success;
      }
      return false;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return false;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setDatabaseContract(null);
    setOfficerContract(null);
    setUserAuthContract(null);
    setTenderContract(null);
    setBidContract(null);
  };

  const addOfficer = async (
    walletAddress: string,
    id: string,
    name: string,
    username: string,
    email: string
  ) => {
    try {
      if (!officerContract) {
        throw new Error("Contract, signer or account not initialized");
      }

      const tx = await officerContract.addOfficer(walletAddress, id, name, username, email);
      await tx.wait();
    } catch (error) {
      console.error("Error adding officer to blockchain:", error);
      throw error;
    }
  };

  const updateOfficer = async (
    walletAddress: string,
    name: string,
    username: string,
    email: string
  ) => {
    try {
      if (!officerContract) throw new Error('Contract not initialized');
      const tx = await officerContract.updateOfficer(walletAddress, name, username, email);
      await tx.wait();
    } catch (err) {
      console.error('Error updating officer on-chain:', err);
      throw err;
    }
  };

  const removeOfficer = async (walletAddress: string) => {
    try {
      if (!officerContract) throw new Error('Contract not initialized');
      const tx = await officerContract.removeOfficer(walletAddress);
      await tx.wait();
    } catch (err) {
      console.error('Error removing officer on-chain:', err);
      throw err;
    }
  };

  const getAllOfficers = async () => {
    try {
      if (!officerContract) {
        throw new Error("Contract or signer not initialized");
      }

      const addresses = await officerContract.getAllOfficerAddresses();
      const officers = [];

      for (const addr of addresses) {
        const officer = await officerContract.getOfficer(addr);
        if (officer.isActive) {
          officers.push({
            id: officer.id,
            name: officer.name,
            username: officer.username,
            email: officer.email,
            walletAddress: addr,
            isActive: officer.isActive,
            createdAt: officer.createdAt.toString()
          });
        }
      }

      return officers;
    } catch (error) {
      console.error("Error getting all officers from blockchain:", error);
      throw error;
    }
  };

  const fetchTenders = async () => {
    try {
      if (!tenderContract) throw new Error('Contract not initialized');
      const ids: string[] = await tenderContract.getAllTenderIds();
      const results: any[] = [];
      for (const id of ids) {
        const tender = await tenderContract.getTender(id);
        // tender status enum: 0 Draft,1 Published,2 Closed,3 Awarded,4 Cancelled
        const status = tender[7];
        if (status === 1) {
          results.push({
            id: tender[0],
            title: tender[1],
            description: tender[2],
            estimatedValue: ethers.utils.formatEther(tender[3]),
            startDate: new Date(tender[4].toNumber() * 1000),
            endDate: new Date(tender[5].toNumber() * 1000),
            createdBy: tender[6],
            status,
            createdAt: new Date(tender[8].toNumber() * 1000),
            category: tender[9],
            department: tender[10],
            location: tender[11],
          });
        }
      }
      return results;
    } catch (error) {
      console.error('Error fetching tenders:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          init();
        }
      }
    };
    checkConnection();
  }, []);

  const value = {
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
    addOfficer,
    updateOfficer,
    removeOfficer,
    getAllOfficers,
    fetchTenders,
    isLoading: loading
  } as Web3ContextType;

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};