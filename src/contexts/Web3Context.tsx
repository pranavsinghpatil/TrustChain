import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TenderManager } from '../contracts/TenderManager';

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: TenderManager | null;
  account: string | null;
  network: ethers.providers.Network | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  contract: null,
  account: null,
  network: null,
  connectWallet: async () => {},
  isConnected: false,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<TenderManager | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<ethers.providers.Network | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Create provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      // Initialize contract
      const contract = new ethers.Contract(
        process.env.REACT_APP_CONTRACT_ADDRESS!,
        TenderManager.abi,
        signer
      ) as TenderManager;

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(accounts[0]);
      setNetwork(network);
      setIsConnected(true);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        network,
        connectWallet,
        isConnected,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}; 