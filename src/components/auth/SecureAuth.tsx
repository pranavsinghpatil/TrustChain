import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureKeyGenerator } from "@/utils/keyGenerator";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";

export function SecureAuth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { connectWallet, isConnected } = useWeb3();
  const { login, register } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        if (!isConnected) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Generate secure wallet
      const { privateKey, address } = await SecureKeyGenerator.generateNewKeyPair();
      
      // Hash password for secure storage
      const hashedPassword = await SecureKeyGenerator.hashPassword(password);
      
      // Register user with wallet address
      const userData = {
        username,
        password: hashedPassword,
        walletAddress: address
      };
      
      const success = await register(userData);
      if (success) {
        // Connect to wallet
        await connectWallet();
        
        // Import wallet to MetaMask
        if (typeof window.ethereum !== 'undefined') {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x7a69', // 31337 in hex
                  chainName: 'Laitlum Network',
                  nativeCurrency: {
                    name: 'Laitlum',
                    symbol: 'LTM',
                    decimals: 18
                  },
                  rpcUrls: ['http://127.0.0.1:8545']
                }
              ]
            });
            
            // Import private key
            await window.ethereum.request({
              method: 'wallet_importPrivateKey',
              params: [privateKey]
            });
          } catch (error) {
            console.error('MetaMask error:', error);
            alert('Please import the private key manually in MetaMask');
          }
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Login' : 'Register'}</CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          {mode === 'register' && (
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
        </Button>
        <div className="flex justify-center mt-4">
          <Button
            variant="link"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
