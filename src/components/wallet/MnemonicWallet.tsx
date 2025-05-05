import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';

interface MnemonicWalletProps {
  onAccountChange?: (account: string) => void;
}

const MnemonicWallet: React.FC<MnemonicWalletProps> = ({ onAccountChange }) => {
  const [mnemonic, setMnemonic] = useState('');
  const [derivedAddress, setDerivedAddress] = useState('');
  const [derivedAddresses, setDerivedAddresses] = useState<string[]>([]);
  const [accountIndex, setAccountIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState('');

  const handleGenerateNewMnemonic = () => {
    const newMnemonic = generateNewMnemonic();
    setMnemonic(newMnemonic);
    const generateSecureWallet = async () => {
      try {
        setIsLoading(true);
        
        // Generate a new secure mnemonic
        const wallet = ethers.Wallet.createRandom();
        const mnemonic = wallet.mnemonic.phrase;
        
        // Derive first 3 addresses
        const addresses = [];
        for (let i = 0; i < 3; i++) {
          const derivedWallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
          addresses.push(derivedWallet.address);
        }
        
        // Store mnemonic securely (in local storage with encryption)
        const encryptedMnemonic = await encryptMnemonic(mnemonic);
        localStorage.setItem('encryptedMnemonic', encryptedMnemonic);
        
        setMnemonic(mnemonic);
        setDerivedAddresses(addresses);
        setDerivedAddress(addresses[0]);
        setAccountIndex(0);
        
        if (onAccountChange) {
          onAccountChange(addresses[0]);
        }
        
        toast.success('Secure wallet generated successfully!');
        
        // Show security warning
        toast.warning('IMPORTANT: Save your mnemonic phrase in a secure place. If you lose it, you will lose access to your funds.');
      } catch (error) {
        console.error('Error generating secure wallet:', error);
        toast.error('Failed to generate secure wallet');
      } finally {
        setIsLoading(false);
      }
    };
    generateSecureWallet();
  };

  const generateMnemonic = async () => {
    try {
      setIsLoading(true);
      const wallet = ethers.Wallet.createRandom();
      setMnemonic(wallet.mnemonic.phrase);
      setDerivedAddress(wallet.address);
      setDerivedAddresses([wallet.address]);
      setAccountIndex(0);
      toast.success('Mnemonic generated successfully!');
    } catch (error) {
      console.error('Error generating mnemonic:', error);
      toast.error('Failed to generate mnemonic');
    } finally {
      setIsLoading(false);
    }
  };

  const encryptMnemonic = async (mnemonic: string): Promise<string> => {
    try {
      // Generate a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltString = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Derive a key from the salt
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('your-secret-key-here'),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Encrypt the mnemonic
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        new TextEncoder().encode(mnemonic)
      );
      
      // Return encrypted data with salt and iv
      return JSON.stringify({
        salt: saltString,
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        encrypted: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
      });
    } catch (error) {
      console.error('Error encrypting mnemonic:', error);
      throw error;
    }
  };

  const handleGenerateWallet = async () => {
    try {
      if (!mnemonicInput) {
        toast.error('Please enter a mnemonic phrase');
        return;
      }

      const wallet = await generateWalletFromMnemonic();
      toast({
        title: 'Success',
        description: `Wallet generated successfully! Address: ${wallet.address}`,
      });
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate wallet',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Mnemonic Wallet Management</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Mnemonic Phrase</label>
        <Input
          type="text"
          value={mnemonicInput}
          onChange={(e) => setMnemonicInput(e.target.value)}
          placeholder="Enter your mnemonic phrase..."
          className="mt-1 block w-full"
        />
      </div>

      <Button
        onClick={handleGenerateNewMnemonic}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Generating...' : 'Generate New Mnemonic'}
      </Button>

      <Button
        onClick={handleGenerateWallet}
        disabled={isLoading || !mnemonicInput}
        className="w-full"
      >
        {isLoading ? 'Generating...' : 'Generate Wallet'}
      </Button>

      {mnemonic && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Your Mnemonic Phrase:</h3>
          <p className="text-sm text-gray-600 break-words mb-4">{mnemonic}</p>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(mnemonic)}
            className="w-full"
          >
            Copy Mnemonic
          </Button>
        </div>
      )}

      {derivedAddresses.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Derived Accounts:</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {derivedAddresses.map((address, index) => (
              <Button
                key={index}
                variant={index === accountIndex ? "default" : "outline"}
                onClick={() => {
                  setDerivedAddress(address);
                  setAccountIndex(index);
                  if (onAccountChange) {
                    onAccountChange(address);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Account {index + 1}
              </Button>
            ))}
          </div>
          <div className="text-sm text-gray-600 break-words mb-4">
            Current address: {derivedAddress}
          </div>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(derivedAddress)}
            className="w-full"
          >
            Copy Address
          </Button>
        </div>
      )}
    </div>
  );
};

export default MnemonicWallet;
