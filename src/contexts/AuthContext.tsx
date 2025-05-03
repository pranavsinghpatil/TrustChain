import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, AuthState, Notification, RegisterData } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "./Web3Context";
import { ethers } from "ethers";

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  users: User[];
  createOfficer: (name: string, username: string, password: string, email?: string) => void;
  updateOfficer: (id: string, fields: { name?: string; username?: string; email?: string; walletAddress?: string }) => void;
  removeOfficer: (id: string) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string, remark: string) => void;
  updateUser: (id: string, fields: { name?: string; email?: string; password?: string }) => void;
  updateUsers: (updatedUsers: User[]) => void;
  notifications: Notification[];
  notifyUser: (recipientId: string, message: string, relatedUserId?: string) => void;
  notifyOfficers: (message: string, relatedUserId?: string) => void;
  markNotificationRead: (id: string) => void;
  syncOfficersFromBlockchain: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined users for demonstration (in a real app, these would be in a database)
const DEMO_USERS: User[] = [
  {
    id: "admin-1",
    name: "Admin User",
    username: "admin",
    role: "admin",
    createdAt: new Date(),
  },
  {
    id: "officer-1",
    name: "Tender Officer",
    username: "teno",
    role: "officer",
    createdAt: new Date(),
  },
  {
    id: "bidder-1",
    name: "Sam Bidder",
    username: "sam",
    role: "bidder",
    createdAt: new Date(),
  }
];

// Password map for local authentication (will be replaced with blockchain in production)
const PASSWORD_MAP: Record<string, string> = {
  admin: 'admin123',
  officer: 'officer123',
  bidder: 'bidder123'
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const { 
    account, 
    isConnected, 
    connectWallet, 
    addOfficer: addBlockchainOfficer,
    updateOfficer: updateBlockchainOfficer,
    removeOfficer: removeBlockchainOfficer,
    getAllOfficers,
    isLoading: isWeb3Loading
  } = useWeb3();

  // Notification utilities
  const notifyUser = (recipientId: string, message: string, relatedUserId?: string) => {
    const newNotif: Notification = { id: `notif-${Date.now()}-${recipientId}`, recipientId, message, relatedUserId, isRead: false, createdAt: new Date() };
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
    try {
      localStorage.setItem("trustchain_users", JSON.stringify(updatedUsers));
      console.log("Users persisted to localStorage:", updatedUsers.map(u => u.username));
    } catch (error) {
      console.error("Error persisting users:", error);
    }
  };

  // Add a new function to persist PASSWORD_MAP to localStorage
  const persistPasswordMap = (passwordMap: Record<string, string>) => {
    try {
      localStorage.setItem("trustchain_passwords", JSON.stringify(passwordMap));
      console.log("Password map persisted to localStorage");
    } catch (error) {
      console.error("Error persisting password map:", error);
    }
  };

  // Add a new function to sync officers from blockchain
  const syncOfficersFromBlockchain = async () => {
    try {
      if (!isConnected) {
        console.log("Wallet not connected, can't sync officers from blockchain");
        return;
      }
      
      // Get all officers from blockchain
      const blockchainOfficers = await getAllOfficers();
      if (!blockchainOfficers || blockchainOfficers.length === 0) {
        console.log("No officers found on blockchain");
        return;
      }
      
      console.log("Officers from blockchain:", blockchainOfficers);
      
      // Convert blockchain officers to our User format
      const officersFromBlockchain = blockchainOfficers.map(officer => ({
        id: officer.id,
        name: officer.name,
        username: officer.username,
        email: officer.email,
        role: 'officer' as UserRole, // Cast to UserRole type
        createdAt: officer.createdAt,
        isApproved: officer.isActive,
        approvalRemark: '',
        walletAddress: officer.walletAddress
      }));
      
      // Merge with existing users, replacing any officers with the same ID
      const nonOfficerUsers = users.filter(user => user.role !== 'officer');
      const mergedUsers = [...nonOfficerUsers, ...officersFromBlockchain];
      
      setUsers(mergedUsers);
      persistUsers(mergedUsers);
      
      console.log("Synced officers from blockchain:", officersFromBlockchain);
    } catch (error) {
      console.error("Error syncing officers from blockchain:", error);
    }
  };
  
  // Try to sync officers when wallet is connected
  useEffect(() => {
    if (isConnected && account) {
      syncOfficersFromBlockchain();
    }
  }, [isConnected, account]);

  useEffect(() => {
    // Check if user is stored in local storage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAuthState({
          user: {
            ...parsedUser,
            createdAt: new Date(parsedUser.createdAt)
          },
          isLoading: false,
          error: null,
        });
      } catch (error) {
        localStorage.removeItem("user");
        setAuthState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } else {
      setAuthState({
        user: null,
        isLoading: false,
        error: null,
      });
    }

    // Load persisted users and passwords on initialization
    try {
      const storedUsers = localStorage.getItem("trustchain_users");
      const storedPasswords = localStorage.getItem("trustchain_passwords");
      
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        // Convert date strings back to Date objects
        const processedUsers = parsedUsers.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt)
        }));
        setUsers(processedUsers);
        console.log("Loaded users from localStorage:", processedUsers.map((u: any) => u.username));
      }
      
      if (storedPasswords) {
        const parsedPasswords = JSON.parse(storedPasswords);
        Object.assign(PASSWORD_MAP, parsedPasswords);
        console.log("Loaded passwords from localStorage");
      }
    } catch (error) {
      console.error("Error loading persisted data:", error);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Debug login attempt
      console.log(`Login attempt for username: ${username}`);
      console.log('Available users:', users.map(u => u.username));
      console.log('PASSWORD_MAP keys:', Object.keys(PASSWORD_MAP));
      
      // Find user by username
      const user = users.find(u => u.username === username);
      
      if (!user || PASSWORD_MAP[username] !== password) {
        console.log(`Login failed: User found: ${!!user}, Password match: ${PASSWORD_MAP[username] === password}`);
        setAuthState((prev) => ({ 
          ...prev, 
          isLoading: false, 
          error: "Invalid username or password" 
        }));
        toast({
          title: "Authentication failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return false;
      }
      
      // Success: set auth state and store in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      setAuthState({
        user,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      
      return true;
    } catch (error) {
      setAuthState((prev) => ({ 
        ...prev, 
        isLoading: false, 
        error: "An error occurred while logging in" 
      }));
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Check if username already exists
      if (users.some(u => u.username === data.username)) {
        setAuthState((prev) => ({ 
          ...prev, 
          isLoading: false, 
          error: "Username already exists" 
        }));
        toast({
          title: "Registration failed",
          description: "Username already exists",
          variant: "destructive",
        });
        return false;
      }
      
      // For demo purposes, we'll just create a new user object
      // In a real app, this would make an API call to create the user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        username: data.username,
        walletAddress: data.walletAddress,
        email: data.email,
        role: data.role,
        isApproved: data.role === 'bidder' ? false : true,
        createdAt: new Date(),
        profileData: data,
      };
      
      // Add user to demo users array (in a real app, this would be saved to a database)
      setUsers(prev => [...prev, { ...newUser, approvalRemark: '' }]);
      PASSWORD_MAP[data.username] = data.password;
      
      // Log the user in
      localStorage.setItem("user", JSON.stringify(newUser));
      setAuthState({
        user: newUser,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${newUser.name}!`,
      });
      notifyOfficers(`User ${newUser.name} has registered and awaits approval.`, newUser.id);
      return true;
    } catch (error) {
      setAuthState((prev) => ({ 
        ...prev, 
        isLoading: false, 
        error: "An error occurred during registration" 
      }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setAuthState({
      user: null,
      isLoading: false,
      error: null,
    });
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const createOfficer = async (name: string, username: string, password: string, email?: string) => {
    try {
      const newOfficerId = `officer-${Date.now()}`;
      
      // First create the officer in the blockchain if wallet is connected
      if (isConnected) {
        console.log("Creating officer on blockchain...");
        const success = await addBlockchainOfficer(
          newOfficerId,
          name,
          username,
          email || ""
        );
        
        if (!success) {
          toast({ 
            title: 'Blockchain Error', 
            description: 'Failed to add officer to blockchain',
            variant: 'destructive'
          });
          return;
        }
        
        // After successful blockchain creation, sync officers
        await syncOfficersFromBlockchain();
      }
      
      // Also maintain local state for now (this will be removed in production)
      const newOfficer: User = { 
        id: newOfficerId, 
        name, 
        username, 
        email,
        role: 'officer', 
        createdAt: new Date(), 
        isApproved: true,
        walletAddress: account || undefined
      };
      
      const updatedUsers = [...users, { ...newOfficer, approvalRemark: '' }];
      setUsers(updatedUsers);
      
      // Update PASSWORD_MAP with the new officer's credentials
      PASSWORD_MAP[username] = password;
      
      // Persist changes to localStorage
      persistUsers(updatedUsers);
      persistPasswordMap(PASSWORD_MAP);
      
      console.log(`Officer created: ${name}, username: ${username}, password: ${password}`);
      console.log('Updated PASSWORD_MAP:', {...PASSWORD_MAP});
      console.log('Updated users:', updatedUsers.map(u => u.username));
      
      toast({ title: 'Officer created', description: `${name} has been appointed` });
    } catch (error) {
      console.error("Error creating officer:", error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create officer',
        variant: 'destructive'
      });
    }
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
          // If username is changing, update PASSWORD_MAP
          if (fields.username && fields.username !== u.username) {
            PASSWORD_MAP[fields.username] = PASSWORD_MAP[u.username];
            delete PASSWORD_MAP[u.username];
            persistPasswordMap(PASSWORD_MAP);
          }
          
          return { ...u, ...fields };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      persistUsers(updatedUsers);
      
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
          toast({ 
            title: 'Blockchain Error', 
            description: 'Failed to remove officer from blockchain',
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Update local state
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      
      if (officer?.username) {
        delete PASSWORD_MAP[officer.username];
        persistPasswordMap(PASSWORD_MAP);
      }
      
      // Persist changes to localStorage
      persistUsers(updatedUsers);
      
      toast({ title: 'Officer removed', description: `${officer?.name} has been removed` });
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
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true, approvalRemark: '' } : u));
    notifyUser(id, 'Your account has been approved.', id);
    toast({ title: 'User approved', description: 'User access granted' });
  };

  const rejectUser = (id: string, remark: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: false, approvalRemark: remark } : u));
    notifyUser(id, `Approval reverted: ${remark}`, id);
    const user = users.find(u => u.id === id);
    if (user) notifyOfficers(`User ${user.name} has updated details and awaits re-approval.`, id);
    toast({ title: 'Approval reverted', description: `User remark: ${remark}` });
  };

  const updateUser = (id: string, fields: { name?: string; email?: string; password?: string }) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, name: fields.name ?? u.name, email: fields.email ?? u.email, isApproved: false, approvalRemark: '' } : u));
    const user = users.find(u => u.id === id)!;
    if (fields.password) PASSWORD_MAP[user.username] = fields.password;
    if (authState.user?.id === id) {
      setAuthState(prev => ({
        ...prev,
        user: {
          ...prev.user!,
          name: fields.name ?? prev.user!.name,
          email: fields.email ?? prev.user!.email,
          isApproved: false,
          approvalRemark: ''
        }
      }));
    }
    toast({ title: 'Profile updated', description: 'Details updated and resubmitted for approval' });
    notifyOfficers(`User ${fields.name ?? authState.user?.name} resubmitted profile for approval.`, id);
  };

  const updateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    persistUsers(updatedUsers);
    
    // If any usernames have changed, we need to update the PASSWORD_MAP
    const updatedPasswordMap = { ...PASSWORD_MAP };
    updatedUsers.forEach(user => {
      // If this user has a password in the map, ensure it's under the correct username
      const oldUsername = users.find(u => u.id === user.id)?.username;
      if (oldUsername && oldUsername !== user.username && PASSWORD_MAP[oldUsername]) {
        // Move the password to the new username
        updatedPasswordMap[user.username] = PASSWORD_MAP[oldUsername];
        delete updatedPasswordMap[oldUsername];
      }
    });
    
    // Update PASSWORD_MAP if changes were made
    if (JSON.stringify(PASSWORD_MAP) !== JSON.stringify(updatedPasswordMap)) {
      Object.assign(PASSWORD_MAP, updatedPasswordMap);
      persistPasswordMap(PASSWORD_MAP);
    }
    
    console.log("Users updated:", updatedUsers.map(u => u.username));
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        register,
        createOfficer,
        updateOfficer,
        removeOfficer,
        updateUsers,
        users,
        notifications,
        markNotificationRead,
        approveUser,
        rejectUser,
        updateUser,
        notifyUser,
        notifyOfficers,
        syncOfficersFromBlockchain
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
