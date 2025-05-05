import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  mnemonic: string | null;
  setMnemonic: (mnemonic: string) => void;
  generateWalletFromMnemonic: () => Promise<ethers.Wallet>;
  generateNewMnemonic: () => string;
  wallet: ethers.Wallet | null;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateNewMnemonic = () => {
    return ethers.Wallet.createRandom().mnemonic.phrase;
  };

  const generateWalletFromMnemonic = async () => {
    try {
      if (!mnemonic) {
        throw new Error('No mnemonic phrase provided');
      }

      setIsLoading(true);
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      setWallet(wallet);
      return wallet;
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate wallet from mnemonic',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        mnemonic,
        setMnemonic,
        generateWalletFromMnemonic,
        generateNewMnemonic,
        wallet,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
