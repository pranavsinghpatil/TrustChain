import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';

interface MnemonicWalletProps {
  onAccountChange?: (account: string) => void;
}

const MnemonicWallet: React.FC<MnemonicWalletProps> = ({ onAccountChange }) => {
  const [mnemonic, setMnemonic] = useState('');
  const [derivedAddress, setDerivedAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { activate, deactivate, account } = useWeb3React();

  const generateMnemonic = async () => {
    try {
      setLoading(true);
      const wallet = ethers.Wallet.createRandom();
      setMnemonic(wallet.mnemonic.phrase);
      setDerivedAddress(wallet.address);
      toast.success('Mnemonic generated successfully!');
    } catch (error) {
      console.error('Error generating mnemonic:', error);
      toast.error('Failed to generate mnemonic');
    } finally {
      setLoading(false);
    }
  };

  const connectWithMnemonic = async () => {
    try {
      if (!mnemonic) {
        toast.error('Please enter a mnemonic phrase');
        return;
      }

      setLoading(true);
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Connect using the mnemonic
      await activate(provider, undefined, true);
      
      if (onAccountChange) {
        onAccountChange(wallet.address);
      }
      toast.success('Connected successfully!');
    } catch (error) {
      console.error('Error connecting with mnemonic:', error);
      toast.error('Failed to connect with mnemonic');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    deactivate();
    setMnemonic('');
    setDerivedAddress('');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Mnemonic Wallet</h2>
      
      {!account ? (
        <div className="space-y-4">
          <button
            onClick={generateMnemonic}
            disabled={loading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate New Mnemonic'}
          </button>

          {mnemonic && (
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Your Mnemonic Phrase:</h3>
              <p className="text-sm text-gray-600 break-words">
                {mnemonic}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigator.clipboard.writeText(mnemonic)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Copy Mnemonic
                </button>
              </div>
            </div>
          )}

          {derivedAddress && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Derived Address:</h3>
              <p className="text-sm text-gray-600 break-words">
                {derivedAddress}
              </p>
            </div>
          )}

          <button
            onClick={connectWithMnemonic}
            disabled={loading || !mnemonic}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect with Mnemonic'}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-green-600 font-semibold">Connected to {account}</p>
          <button
            onClick={disconnect}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default MnemonicWallet;
