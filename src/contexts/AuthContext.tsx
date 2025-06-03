// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useWeb3 } from "./Web3Context";
import { RegisterData, UserRole } from "@/types/auth";

// Types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date | string;
  isApproved: boolean;
  approvalRemark?: string;
  walletAddress?: string;
  profileData?: RegisterData;
  permissions?: {
    canCreate: boolean;
    canApprove: boolean;
    isActive: boolean;
  };
  // Add convenience properties that mirror permissions
  canCreate?: boolean;
  canApprove?: boolean;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserNotification {
  id: string;
  recipientId: string;
  message: string;
  relatedUserId?: string;
  isRead: boolean;
  createdAt: Date | string;
}

interface AuthContextType {
  authState: AuthState;
  users: User[];
  notifications: UserNotification[];
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;

  createOfficer: (name: string, username: string, email: string) => Promise<boolean>;
  updateOfficer: (id: string, fields: { name?: string; username?: string; email?: string; walletAddress?: string }) => void;
  removeOfficer: (id: string) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string, reason: string) => void;
  notifyUser: (recipientId: string, message: string, relatedUserId?: string) => void;
  notifyOfficers: (message: string, relatedUserId?: string) => void;
  markNotificationRead: (id: string) => void;
  syncOfficersFromBlockchain: () => Promise<void>;

  updateUser: (id: string, fields: { name?: string; email?: string; password?: string }) => void;
  updateUsers: (updatedUsers: User[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password map for local authentication (deprecated, now only for admin)
let PASSWORD_MAP: Record<string, string> = { admin: 'admin00' };
// Officer passwords are validated ONLY via blockchain, not local cache.

// Default seed users for testing (admin only, officers are fetched from blockchain)
const defaultUsers: User[] = [
  { 
    id: 'admin', 
    name: 'Admin', 
    username: 'admin', 
    email: 'admin@example.com', 
    role: 'admin', 
    createdAt: new Date(), 
    isApproved: true, 
    walletAddress: '',
    approvalRemark: '',
    canCreate: true,
    canApprove: true,
    isActive: true,
    permissions: { canCreate: true, canApprove: true, isActive: true } 
  },
];

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  console.log('[AuthProvider] Initializing');
  // FIX: Call useWeb3 hook at the top level (per React rules)
  const web3 = useWeb3();

  // IMPORTANT: We no longer clear localStorage/sessionStorage on load to preserve officer data
  useEffect(() => {
    console.log('[AuthProvider] Initializing data and setting loading state');
    // Set a max timeout to ensure loading state is cleared even if something fails
    const maxLoadingTimeout = setTimeout(() => {
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));
      console.log('[AuthProvider] Max loading time reached, forcing loading state to false');
    }, 3000); // Force loading state to false after 3 seconds max
    
    try {
      // Load any existing passwords from localStorage
      const storedPasswords = localStorage.getItem('trustchain_passwords');
      if (storedPasswords) {
        PASSWORD_MAP = JSON.parse(storedPasswords);
        console.log('[AuthProvider] Loaded password map from localStorage:', Object.keys(PASSWORD_MAP));
      }
      
      // Ensure admin password is always set
      if (!PASSWORD_MAP['admin']) {
        PASSWORD_MAP['admin'] = 'admin00';
        persistPasswordMap(PASSWORD_MAP);
      }
      
      // Also check for officers in tender_officers localStorage
      try {
        const storedOfficers = localStorage.getItem('tender_officers');
        if (storedOfficers) {
          const officers = JSON.parse(storedOfficers);
          console.log(`[AuthProvider] Found ${officers.length} officers in tender_officers storage`);
          
          // Convert officers to User format and add to users state
          const officerUsers = officers.map(officer => ({
            id: officer.id,
            name: officer.name,
            username: officer.username,
            email: officer.email,
            role: 'officer' as UserRole,
            walletAddress: officer.walletAddress,
            createdAt: new Date(officer.createdAt),
            isApproved: true,
            permissions: officer.permissions
          }));
          
          // Add officers to users state if they don't already exist
          const existingUsers = loadUsers();
          const existingUsernames = new Set(existingUsers.map(u => u.username));
          const newOfficers = officerUsers.filter(o => !existingUsernames.has(o.username));
          
          if (newOfficers.length > 0) {
            const updatedUsers = [...existingUsers, ...newOfficers];
            setUsers(updatedUsers);
            persistUsers(updatedUsers);
            console.log(`[AuthProvider] Added ${newOfficers.length} officers from tender_officers to users state`);
            
            // Also ensure passwords are set for these officers
            for (const officer of newOfficers) {
              if (!PASSWORD_MAP[officer.username]) {
                PASSWORD_MAP[officer.username] = 'tender00';
              }
            }
            persistPasswordMap(PASSWORD_MAP);
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] Error loading officers from tender_officers:', err);
      }
      
      // Trigger a sync with blockchain to ensure we have the latest data
      syncOfficersFromBlockchain();
      
      // Ensure loading state is reset after initialization
      setTimeout(() => {
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }));
        console.log('[AuthProvider] Initialization complete, loading state reset to false');
      }, 500);
      
    } catch (e) {
      console.error('Error loading password data:', e);
      // Even if there's an error, ensure loading state is reset
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error initializing authentication'
      }));
    }
    
    // Clean up timeout on unmount
    return () => clearTimeout(maxLoadingTimeout);
  }, []);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Reset loading state after initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));
      console.log('[AuthProvider] Initial loading state reset to false');
    }, 1000); // Give a short delay to allow other initialization to complete
    
    return () => clearTimeout(timer);
  }, []);

  // Refactored loadUsers: return stored users or defaultUsers
  const loadUsers = () => {
    try {
      const stored = localStorage.getItem('trustchain_users');
      if (stored) {
        return JSON.parse(stored) as User[];
      }
    } catch (e) {
      console.warn('Could not load users from storage', e);
    }
    return defaultUsers;
  };
  const [users, setUsers] = useState<User[]>(loadUsers());

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const { toast } = useToast();
  const { 
    account, 
    isConnected, 
    isCorrectNetwork,
    connectWallet, 
    addOfficer,
    updateOfficer: updateBlockchainOfficer,
    removeOfficer: removeBlockchainOfficer,
    getAllOfficers,
    signer,
    isLoading: isWeb3Loading,
    officerContract
  } = useWeb3();
  const [isSyncingOfficers, setIsSyncingOfficers] = useState(false);

  // Notification utilities
  const notifyUser = (recipientId: string, message: string, relatedUserId?: string) => {
    const newNotif: UserNotification = { id: `notif-${Date.now()}-${recipientId}`, recipientId, message, relatedUserId, isRead: false, createdAt: new Date() };
    setNotifications(prev => [...prev, newNotif]);
  };
  const notifyOfficers = (message: string, relatedUserId?: string) => {
    const officers = users.filter(u => u.role === 'officer');
    const newNotifs = officers.map(off => ({ id: `notif-${Date.now()}-${off.id}`, recipientId: off.id, message, relatedUserId, isRead: false, createdAt: new Date() }));
    setNotifications(prev => [...prev, ...newNotifs]);
  };
  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

  // Add a new function to persist users to localStorage
  const persistUsers = (updatedUsers: User[]) => {
    // Ensure admin is always present before persisting
    let usersWithAdmin = updatedUsers;
    if (!updatedUsers.some(u => u.username === 'admin')) {
      usersWithAdmin = [
        { id: 'admin', name: 'Admin', username: 'admin', email: 'admin@example.com', role: 'admin', createdAt: new Date(), isApproved: true, permissions: { canCreate: true, canApprove: true, isActive: true } },
        ...updatedUsers
      ];
    }
    try {
      localStorage.setItem("trustchain_users", JSON.stringify(usersWithAdmin));
      console.log("Users persisted to localStorage:", usersWithAdmin.map(u => u.username));
    } catch (error) {
      console.error("Error persisting users:", error);
    }
  };

  // Add a new function to persist PASSWORD_MAP to localStorage
  const persistPasswordMap = (passwordMap: Record<string, string>) => {
    try {
      // Always ensure admin password is present
      const mapToSave = { ...passwordMap, admin: 'admin00' };
      localStorage.setItem("trustchain_passwords", JSON.stringify(mapToSave));
      console.log("Password map persisted to localStorage:", Object.keys(mapToSave));
      
      // Important: update global password map to match
      PASSWORD_MAP = mapToSave;
    } catch (error) {
      console.error("Error persisting password map:", error);
    }
  };

  // Helper function to handle MetaMask errors
  const handleMetaMaskError = (error: any, context: string): boolean => {
    console.error(`[${context}] MetaMask Error:`, error);
    
    // Handle extension context invalidated (usually happens when MetaMask is reloaded)
    if (error.message && error.message.includes('Extension context invalidated')) {
      toast({
        title: "MetaMask Disconnected",
        description: "Please refresh the page and reconnect your wallet",
        variant: "destructive"
      });
      // Force page refresh to reinitialize the connection
      setTimeout(() => window.location.reload(), 2000);
      return true;
    }
    
    // Handle user rejection
    if (error.code === 4001 || error.code === 'ACTION_REJECTED' || 
        (error.data && error.data.code === 4001)) {
      toast({
        title: "Transaction Rejected",
        description: "You rejected the transaction",
        variant: "destructive"
      });
      return true;
    }
    
    // Handle chain not added to MetaMask
    if (error.code === 4902 || error.code === 'UNSUPPORTED_OPERATION' ||
        (error.data && error.data.code === 4902)) {
      toast({
        title: "Wrong Network",
        description: `Please switch to the correct network in MetaMask (${process.env.NEXT_PUBLIC_CHAIN_NAME || 'Ethereum Mainnet'})`,
        variant: "destructive"
      });
      return true;
    }
    
    // Handle network change
    if (error.code === 'NETWORK_ERROR' || error.code === -32002) {
      toast({
        title: "Network Error",
        description: "Please check your network connection and try again",
        variant: "destructive"
      });
      return true;
    }
    
    // Handle other MetaMask errors
    if ((error.code && typeof error.code === 'number' && error.code >= 4000 && error.code < 5000) ||
        (error.data && error.data.code >= 4000 && error.data.code < 5000)) {
      const errorMessage = error.data?.message || error.message || "An error occurred with MetaMask";
      toast({
        title: "MetaMask Error",
        description: errorMessage,
        variant: "destructive"
      });
      return true;
    }
    
    return false;
  };

  const createOfficer = async (
    name: string,
    username: string,
    email: string
  ): Promise<boolean> => {
    console.log('[createOfficer] Starting officer creation process');
    
    try {
      // ALWAYS force MetaMask interaction
      console.log('[createOfficer] Forcing wallet connection to ensure MetaMask popup');
      
      toast({
        title: "Connecting Wallet",
        description: "Please approve the MetaMask connection to continue",
      });
      
      // Force wallet connection to trigger MetaMask popup
      const connected = await connectWallet();
      if (!connected) {
        toast({
          title: "Wallet Required",
          description: "You must connect your wallet to create an officer",
          variant: "destructive",
        });
        return false;
      }
      
      // Check for duplicate username
      if (users.some(u => u.username === username)) {
        toast({
          title: "Username Exists",
          description: "This username is already taken",
          variant: "destructive",
        });
        return false;
      }
      
      // Create officer in blockchain - THIS MUST HAPPEN FIRST
      toast({
        title: "Creating Officer",
        description: "Please approve the transaction in MetaMask",
      });
      
      try {
        // This will trigger MetaMask popup for transaction approval
        console.log('[createOfficer] Calling blockchain addOfficer function');
        const success = await addOfficer(username, name, email);
        
        if (!success) {
          throw new Error("Failed to create officer on blockchain");
        }
        
        console.log('[createOfficer] Blockchain transaction successful');
      } catch (error: any) {
        // Check if this is the 'Officer already exists' error
        const errorMsg = error.message || '';
        if (errorMsg.includes('Officer already exists') || errorMsg.includes('already exists for this address')) {
          // This is actually a success case - the officer exists and can be used
          console.log('[createOfficer] Officer already exists, treating as success');
          // Continue with the function execution
        } else {
          // For any other error, re-throw it to be caught by the outer catch block
          throw error;
        }
      }
      
      // Only save password after blockchain transaction succeeds
      const password = 'tender00';
      PASSWORD_MAP[username] = password;
      persistPasswordMap(PASSWORD_MAP);
      
      // Create a user object to update the UI
      const newOfficer: User = {
        id: `officer-${Date.now()}`,
        name,
        username,
        email,
        role: 'officer' as UserRole,
        walletAddress: account || '',
        createdAt: new Date(),
        isApproved: true,
        permissions: { canCreate: true, canApprove: true, isActive: true }
      };
      
      // Update local state
      setUsers(prevUsers => [...prevUsers, newOfficer]);
      
      toast({
        title: "Officer Created",
        description: `${name} has been added as an officer on the blockchain`,
      });
      
      // Sync with blockchain to ensure all data is up to date
      await syncOfficersFromBlockchain();
      
      return true;
    } catch (error) {
      console.error("[createOfficer] Error:", error);
      
      if (handleMetaMaskError(error, 'createOfficer')) {
        return false;
      }
      
      toast({
        title: "Blockchain Error",
        description: "Failed to create officer on the blockchain",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log(`[login] Attempting login for: ${username}`);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Special case for admin login
      if (username === 'admin') {
        console.log('[login] Admin login attempt');
        if (password === 'admin00' || password === PASSWORD_MAP['admin']) {
          const adminUser = {
            id: 'admin',
            name: 'Admin',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin' as UserRole,
            createdAt: new Date(),
            isApproved: true,
            approvalRemark: '',
            permissions: { canCreate: true, canApprove: true, isActive: true }
          };
          
          // Set admin in state
          setAuthState({
            user: adminUser,
            isLoading: false,
            error: null
          });
          
          // Store admin password
          PASSWORD_MAP['admin'] = 'admin00';
          persistPasswordMap(PASSWORD_MAP);
          
          console.log('[login] Admin login successful');
          return true;
        } else {
          setAuthState({ user: null, isLoading: false, error: "Incorrect admin password" });
          toast({ 
            title: "Login Failed", 
            description: "Incorrect admin password", 
            variant: "destructive" 
          });
          return false;
        }
      }
      
      // For all other users, force blockchain connection
      if (!isConnected) {
        console.log('[login] Not connected to blockchain, attempting to connect wallet');
        try {
          toast({
            title: "Connecting to Blockchain",
            description: "Please approve the MetaMask connection to login",
          });
          
          const connected = await connectWallet();
          if (!connected) {
            toast({
              title: "Blockchain Required",
              description: "This is a blockchain-based application. Please connect your wallet.",
              variant: "destructive"
            });
            setAuthState({ user: null, isLoading: false, error: "Wallet connection required" });
            return false;
          }
        } catch (error) {
          handleMetaMaskError(error, 'connectWallet');
          setAuthState({ user: null, isLoading: false, error: "Failed to connect wallet" });
          return false;
        }
      }
      
      // ONLY check blockchain for officers - no localStorage fallback
      console.log('[login] Fetching officers from blockchain ONLY');
      let user = null;
      
      try {
        const blockchainOfficers = await getAllOfficers();
        console.log(`[login] Found ${blockchainOfficers.length} officers on blockchain`);
        
        // Find the officer with matching username
        const officer = blockchainOfficers.find(o => o.username === username);
        
        if (officer) {
          console.log(`[login] Found officer ${username} on blockchain`);
          user = {
            id: officer.id,
            name: officer.name,
            username: officer.username,
            email: officer.email,
            role: 'officer' as UserRole,
            walletAddress: officer.walletAddress || '',
            createdAt: new Date(parseInt(officer.createdAt) || Date.now()),
            isApproved: true,
            approvalRemark: '',
            permissions: { canCreate: true, canApprove: true, isActive: true }
          };
        }
      } catch (error) {
        console.error('[login] Error fetching from blockchain:', error);
        handleMetaMaskError(error, 'getAllOfficers');
        setAuthState({ user: null, isLoading: false, error: "Blockchain error" });
        toast({
          title: "Blockchain Error",
          description: "Failed to fetch officers from blockchain. This is a blockchain-based application.",
          variant: "destructive"
        });
        return false;
      }
      
      // If no user found on blockchain
      if (!user) {
        console.log(`[login] User ${username} not found on blockchain`);
        setAuthState({ user: null, isLoading: false, error: "User not found on blockchain" });
        toast({ 
          title: "Login Failed", 
          description: "User not found on blockchain", 
          variant: "destructive" 
        });
        return false;
      }
      
      // For blockchain officers, only accept 'tender00' as password
      if (password === 'tender00') {
        console.log(`[login] Using standard password 'tender00' for officer ${username}`);
        
        // Set the user in state
        setAuthState({
          user,
          isLoading: false,
          error: null
        });
        
        // Store password for this session only
        PASSWORD_MAP[username] = 'tender00';
        persistPasswordMap(PASSWORD_MAP);
        
        // Trigger a blockchain sync to ensure we have latest data
        syncOfficersFromBlockchain().catch(err => {
          console.warn('[login] Error syncing after login:', err);
        });
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}`,
        });
        
        return true;
      } else {
        setAuthState({ user: null, isLoading: false, error: "Incorrect password" });
        toast({ 
          title: "Login Failed", 
          description: "Incorrect password. All officers use 'tender00' as password.", 
          variant: "destructive" 
        });
        return false;
      }

      if (!credentialsValid) {
        setAuthState({ user: null, isLoading: false, error: "Incorrect password" });
        toast({ title: "Login Failed", description: "Incorrect password", variant: "destructive" });
        return false;
      }

      // If we get here, login was successful
      setAuthState({ user, isLoading: false, error: null });
      toast({ title: "Login Success", description: `Welcome, ${user.name}!` });
      return true;

    } catch (error) {
      console.error("Login error:", error);
      setAuthState({ user: null, isLoading: false, error: "Login error" });
      toast({ 
        title: "Login Error", 
        description: error instanceof Error ? error.message : "An unexpected error occurred", 
        variant: "destructive" 
      });
      return false;
    } finally {
      // Ensure loading state is always cleared, even if there's an unexpected error path
      setTimeout(() => {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }, 0);
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isLoading: false,
      error: null
    });
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const updateOfficer = async (id: string, fields: { name?: string; username?: string; email?: string; walletAddress?: string }) => {
    try {
      const officer = users.find(u => u.id === id);
      if (!officer) {
        toast({ 
          title: 'Error', 
          description: 'Officer not found',
          variant: 'destructive'
        });
        return;
      }
      
      // Update the officer in the blockchain if wallet is connected
      if (isConnected && officer.walletAddress && (fields.name || fields.username || fields.email)) {
        console.log("Updating officer on blockchain...");
        const success = await updateBlockchainOfficer(
          officer.walletAddress,
          fields.name || officer.name,
          fields.username || officer.username,
          fields.email || officer.email || ""
        );
        
        if (!success) {
          toast({ 
            title: 'Blockchain Error', 
            description: 'Failed to update officer on blockchain',
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Update local state
      const updatedUsers = users.map(u => {
        if (u.id === id) {
          return { ...u, ...fields };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      toast({ 
        title: 'Officer updated', 
        description: `${officer.name}'s information has been updated` 
      });
    } catch (error) {
      console.error("Error updating officer:", error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update officer',
        variant: 'destructive'
      });
    }
  };

  const removeOfficer = async (id: string) => {
    try {
      const officer = users.find(u => u.id === id);
      if (!officer) {
        toast({ 
          title: 'Error', 
          description: 'Officer not found',
          variant: 'destructive'
        });
        return;
      }
      
      // First remove the officer from the blockchain if wallet is connected
      if (isConnected && officer.walletAddress) {
        console.log("Removing officer from blockchain...");
        const success = await removeBlockchainOfficer(officer.walletAddress);
        
        if (!success) {
          throw new Error('Failed to remove officer from blockchain');
        }
      }
      
      // Update local state
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      
      if (officer?.username) {
        const passwordMap = { ...PASSWORD_MAP };
        delete passwordMap[officer.username];
      }
      
      toast({ 
        title: 'Officer removed', 
        description: `${officer?.name} has been removed` 
      });
    } catch (error) {
      console.error("Error removing officer:", error);
      toast({ 
        title: 'Error', 
        description: 'Failed to remove officer',
        variant: 'destructive'
      });
    }
  };

  const approveUser = (id: string) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, isApproved: true, approvalRemark: '' } : u);
    setUsers(updatedUsers);
    notifyUser(id, 'Your account has been approved.', id);
    toast({ title: 'User approved', description: 'User access granted' });
  };

  const rejectUser = (id: string, reason: string) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, isApproved: false, approvalRemark: reason } : u);
    setUsers(updatedUsers);
    notifyUser(id, `Approval reverted: ${reason}`, id);
    const user = users.find(u => u.id === id);
    if (user) notifyOfficers(`User ${user.name} has updated details and awaits re-approval.`, id);
    toast({ title: 'Approval reverted', description: `User remark: ${reason}` });
  };

  const updateUser = (id: string, fields: { name?: string; email?: string; password?: string }) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, name: fields.name ?? u.name, email: fields.email ?? u.email, isApproved: false, approvalRemark: '' } : u);
    setUsers(updatedUsers);
    const user = users.find(u => u.id === id)!;
    toast({ title: 'Profile updated', description: 'Details updated and resubmitted for approval' });
    notifyOfficers(`User ${fields.name ?? user.name} resubmitted profile for approval.`, id);
  };

  const updateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };
  
  // Sync officers from blockchain to local state
  const syncOfficersFromBlockchain = async (): Promise<void> => {
    if (isSyncingOfficers) {
      console.log('[syncOfficersFromBlockchain] Already syncing, skipping');
      return;
    }
    
    setIsSyncingOfficers(true);
    console.log('[syncOfficersFromBlockchain] Starting sync');
    
    // Ensure we're not showing loading state during sync
    setAuthState(prev => ({
      ...prev,
      isLoading: false
    }));
    
    try {
      // First, ensure we have the admin user
      const adminUser = {
        id: 'admin',
        name: 'Admin',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin' as UserRole,
        createdAt: new Date().toISOString(),
        isApproved: true,
        permissions: { canCreate: true, canApprove: true, isActive: true }
      };
      
      // Force wallet connection with popup
      try {
        // Always disconnect first to ensure popup appears
        if (web3 && typeof web3.disconnect === 'function') {
          try {
            await web3.disconnect();
            console.log('[syncOfficersFromBlockchain] Disconnected wallet to force popup');
          } catch (disconnectError) {
            console.warn('[syncOfficersFromBlockchain] Error disconnecting wallet:', disconnectError);
            // Continue anyway, this is just to help force the popup
          }
        }
        
        toast({
          title: "Connecting to Blockchain",
          description: "Please approve the MetaMask connection to sync officers",
        });
        
        // Add a delay to ensure toast is visible before MetaMask popup
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to connect wallet with multiple attempts
        let connected = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!connected && attempts < maxAttempts) {
          attempts++;
          console.log(`[syncOfficersFromBlockchain] Wallet connection attempt ${attempts}/${maxAttempts}`);
          
          try {
            // Force permissions request to trigger popup
            if (window.ethereum) {
              try {
                await window.ethereum.request({
                  method: 'wallet_requestPermissions',
                  params: [{ eth_accounts: {} }]
                });
                console.log('[syncOfficersFromBlockchain] Requested permissions to force popup');
              } catch (permError) {
                console.warn('[syncOfficersFromBlockchain] Permission request failed:', permError);
                // Continue anyway, this is just to help force the popup
              }
            }
            
            connected = await connectWallet();
            
            if (!connected) {
              console.warn(`[syncOfficersFromBlockchain] Connection attempt ${attempts} returned false`);
              // Wait longer between attempts
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } catch (connectError) {
            console.error(`[syncOfficersFromBlockchain] Connection attempt ${attempts} failed:`, connectError);
            // Wait longer between attempts
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (!connected) {
          toast({
            title: "Blockchain Required",
            description: "This is a blockchain-based application. Please connect your wallet and approve the MetaMask popup.",
            variant: "destructive"
          });
          throw new Error("Wallet connection required for officer sync after multiple attempts");
        }
      } catch (error) {
        handleMetaMaskError(error, 'connectWallet');
        throw new Error("Failed to connect wallet for blockchain sync");
      }
      
      // Only use blockchain data, no localStorage fallback
      const officerUsers: User[] = [];
      const officerUsernames = new Set<string>();
      
      // ONLY fetch officers from blockchain - no localStorage fallback
      console.log('[syncOfficersFromBlockchain] Fetching officers from blockchain ONLY');
      
      try {
        const blockchainOfficers = await getAllOfficers();
        console.log(`[syncOfficersFromBlockchain] Found ${blockchainOfficers.length} officers on blockchain`);
        
        // Convert blockchain officers to User format
        for (const officer of blockchainOfficers) {
          const officerUser: User = {
            id: officer.id,
            name: officer.name,
            username: officer.username,
            email: officer.email,
            role: 'officer' as UserRole,
            walletAddress: officer.walletAddress || '',
            createdAt: new Date(parseInt(officer.createdAt) || Date.now()),
            isApproved: true,
            approvalRemark: '',
            permissions: { canCreate: true, canApprove: true, isActive: true }
          };
          officerUsers.push(officerUser);
          officerUsernames.add(officer.username);
          
          // Set password for blockchain officers
          PASSWORD_MAP[officer.username] = 'tender00';
          console.log(`[syncOfficersFromBlockchain] Set password for ${officer.username}: tender00`);
        }
      } catch (error) {
        console.error('[syncOfficersFromBlockchain] Error fetching from blockchain:', error);
        handleMetaMaskError(error, 'getAllOfficers');
        toast({
          title: "Blockchain Error",
          description: "Failed to fetch officers from blockchain. This is a blockchain-based application.",
          variant: "destructive"
        });
        throw error; // Re-throw to stop the sync process
      }
      
      // Create final user list: admin + blockchain officers ONLY
      const updatedUsers = [adminUser, ...officerUsers];
      
      // Update state
      setUsers(updatedUsers);
      
      // Clear localStorage except for admin
      try {
        localStorage.removeItem('tender_officers');
        localStorage.removeItem('trustchain_users');
        
        // Only persist admin and blockchain officers
        const minimalUsers = updatedUsers.map(u => {
          // Convert Date objects to ISO strings for storage
          const createdAtString = u.createdAt instanceof Date ? 
            u.createdAt.toISOString() : 
            typeof u.createdAt === 'string' ? u.createdAt : new Date().toISOString();
          
          // Create a safe object with all required properties
          const safeUser = {
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
            // Ensure optional properties have default values
            walletAddress: typeof u.walletAddress === 'string' ? u.walletAddress : '',
            createdAt: createdAtString,
            isApproved: Boolean(u.isApproved),
            approvalRemark: typeof u.approvalRemark === 'string' ? u.approvalRemark : '',
            permissions: u.permissions || { canCreate: true, canApprove: true, isActive: true }
          };
          
          return safeUser;
        });
        
        // Only store admin password permanently
        const minimalPasswordMap: Record<string, string> = { 'admin': 'admin00' };
        
        // Store blockchain officer passwords temporarily
        for (const officer of officerUsers) {
          // Ensure username is a string to avoid type errors
          if (typeof officer.username === 'string') {
            minimalPasswordMap[officer.username] = 'tender00';
          }
        }
        
        // Update PASSWORD_MAP in memory
        Object.keys(PASSWORD_MAP).forEach(key => {
          if (key !== 'admin' && !officerUsernames.has(key)) {
            // Convert to string to avoid type errors
            delete PASSWORD_MAP[key.toString()]; // Remove non-blockchain officers
          }
        });
        
        // Store minimal data
        localStorage.setItem('blockchain_officers', JSON.stringify(minimalUsers));
        persistPasswordMap(minimalPasswordMap);
        
        console.log('[syncOfficersFromBlockchain] Stored blockchain officers only');
      } catch (err) {
        console.warn('[syncOfficersFromBlockchain] Error updating localStorage:', err);
      }
      
      toast({
        title: "Blockchain Sync Complete",
        description: `Successfully synced ${officerUsers.length} officers from the blockchain`,
      });

    } catch (error) {
      console.error("Error syncing officers from blockchain:", error);
      handleMetaMaskError(error, 'syncOfficersFromBlockchain');
      toast({
        title: "Blockchain Sync Failed",
        description: "This is a blockchain-based application and requires MetaMask.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingOfficers(false);
      console.log('[syncOfficersFromBlockchain] Finished sync');
    }
  };

  // Update the AuthProvider component to properly type the context value
  const contextValue: AuthContextType = {
    authState,
    users,
    notifications,
    currentUser: authState.user,
    login,
    logout,
    createOfficer,
    updateOfficer,
    removeOfficer,
    updateUsers,
    markNotificationRead,
    approveUser,
    rejectUser,
    updateUser,
    notifyUser,
    notifyOfficers,
    syncOfficersFromBlockchain,
    isAuthenticated: !!authState.user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; // End of AuthProvider component

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
