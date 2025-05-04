import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/hooks/use-toast";

export function WalletManager() {
  const { 
    account, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    chainId,
    isCorrectNetwork,
    switchNetwork
  } = useWeb3();
  
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await connectWallet();
      if (success) {
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been connected successfully!",
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handleSwitchNetwork = async () => {
    try {
      const success = await switchNetwork();
      if (success) {
        toast({
          title: "Network Switched",
          description: "You are now connected to the Laitlum Network.",
        });
      }
    } catch (error) {
      console.error("Network switch error:", error);
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch network. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Test wallet with 10,000 LTM
  const importTestWallet = async () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Instructions to import account
      toast({
        title: "Import Test Account",
        description: "Please open MetaMask, click on your account icon, select 'Import Account', and paste the private key provided in the next notification.",
      });
      
      // Show private key
      setTimeout(() => {
        toast({
          title: "Test Account Private Key",
          description: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        });
      }, 3000);
    } catch (error) {
      console.error("Error importing test wallet:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Wallet Connection</CardTitle>
        <CardDescription>Connect your wallet to use the Laitlum Network</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted">
              <p className="font-medium">Connected Account</p>
              <p className="text-sm text-muted-foreground">{account ? formatAddress(account) : 'Unknown'}</p>
            </div>
            
            {!isCorrectNetwork && (
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                <p className="font-medium text-amber-800 dark:text-amber-300">Wrong Network</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  You're connected to chain ID: {chainId}. Please switch to Laitlum Network.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted">
              <p className="font-medium">Not Connected</p>
              <p className="text-sm text-muted-foreground">Connect your wallet to use this application</p>
            </div>
            
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <p className="font-medium text-blue-800 dark:text-blue-300">Need a Test Wallet?</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                Import a test wallet with 10,000 LTM for testing
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={importTestWallet}
                className="w-full"
              >
                Import Test Wallet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {isConnected ? (
          <>
            {!isCorrectNetwork && (
              <Button 
                onClick={handleSwitchNetwork} 
                className="w-full"
                variant="secondary"
              >
                Switch to Laitlum Network
              </Button>
            )}
            <Button 
              onClick={handleDisconnect} 
              variant="destructive" 
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleConnect} 
            className="w-full" 
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
