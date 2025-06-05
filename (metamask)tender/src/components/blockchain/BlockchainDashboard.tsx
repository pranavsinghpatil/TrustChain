import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TransactionHistory from './TransactionHistory';

interface BlockchainDashboardProps {
  showTransactions?: boolean;
}

const BlockchainDashboard: React.FC<BlockchainDashboardProps> = ({ 
  showTransactions = true
}) => {
  const { connectWallet, account, isConnected, networkName, recordTransaction } = useWeb3();
  const { authState } = useAuth();
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  
  // Check if the connected wallet matches the user's registered wallet
  const isWalletMatched = authState.user?.walletAddress && 
    isConnected && 
    account?.toLowerCase() === authState.user.walletAddress.toLowerCase();
  
  // Check if user has a wallet but it's not connected
  const hasUnconnectedWallet = authState.user?.walletAddress && !isWalletMatched;
  
  // Function to copy wallet address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };
  
  // Function to handle wallet connection with better error handling
  const handleConnectWallet = async () => {
    try {
      console.log("Connect wallet button clicked");
      const success = await connectWallet();
      
      if (success) {
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been connected successfully",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting your wallet",
        variant: "destructive",
      });
    }
  };
  
  // Record wallet connection as a transaction
  useEffect(() => {
    const recordWalletConnection = async () => {
      if (isConnected && account && authState.user) {
        await recordTransaction(
          authState.user.id,
          'wallet_connect',
          `0x${Date.now().toString(16)}`, // Mock transaction hash
          `Wallet ${account.slice(0, 6)}...${account.slice(-4)} connected`
        );
      }
    };
    
    if (isConnected && account && authState.user) {
      recordWalletConnection();
    }
  }, [isConnected, account, authState.user?.id]);
  
  return (
    <div className="space-y-6">
      <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Blockchain Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to interact with the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-md">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <h4 className="font-medium text-yellow-500">Wallet Not Connected</h4>
                  <p className="text-sm text-gray-400">
                    Connect your wallet to sign transactions and interact with the blockchain
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleConnectWallet}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
              
              {hasUnconnectedWallet && (
                <div className="mt-4 p-3 border border-gray-700 rounded-md bg-gray-800/30">
                  <p className="text-sm text-gray-300 mb-2">
                    Your account has a registered wallet address:
                  </p>
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-green-400/80 font-mono">
                      {authState.user?.walletAddress}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => authState.user?.walletAddress && copyToClipboard(authState.user.walletAddress)}
                    >
                      <Copy className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-4 border rounded-md ${
                isWalletMatched 
                  ? 'border-green-500/20 bg-green-500/5' 
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}>
                {isWalletMatched ? (
                  <Check className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                )}
                
                <div>
                  <h4 className={`font-medium ${
                    isWalletMatched ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {isWalletMatched 
                      ? 'Wallet Connected & Verified' 
                      : 'Wallet Connected (Unverified)'}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {isWalletMatched 
                      ? 'Your wallet is connected and matches your account' 
                      : 'This wallet does not match your registered wallet address'}
                  </p>
                </div>
              </div>
              
              <div className="p-4 border border-gray-700 rounded-md bg-black/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Connected Wallet</span>
                  <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-300">
                    {networkName || 'Unknown Network'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <code className="text-sm text-green-400 font-mono">
                    {account}
                  </code>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => account && copyToClipboard(account)}
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 w-7 p-0"
                      asChild
                    >
                      <a 
                        href={`https://etherscan.io/address/${account}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                {walletBalance && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Balance</span>
                      <span className="text-sm text-white font-medium">{walletBalance} ETH</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showTransactions && (
        <TransactionHistory userId={authState.user?.id} limit={5} />
      )}
    </div>
  );
};

export default BlockchainDashboard;
