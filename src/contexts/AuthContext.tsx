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
  createdAt: Date;
  isApproved: boolean;
  approvalRemark?: string;
  walletAddress?: string;
  profileData?: RegisterData;
  permissions?: {
    canCreate: boolean;
    canApprove: boolean;
    isActive: boolean;
  };
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
  createdAt: Date;
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

// Password map for local authentication (will be replaced with blockchain in production)
const PASSWORD_MAP: Record<string, string> = {};

// Default seed users for testing
const defaultUsers: User[] = [
  { id: 'admin', name: 'Admin', username: 'admin', email: 'admin@example.com', role: 'admin', createdAt: new Date(), isApproved: true, permissions: { canCreate: true, canApprove: true, isActive: true } },
  { id: 'officer', name: 'Officer', username: 'teno', email: 'officer@example.com', role: 'officer', createdAt: new Date(), isApproved: true, permissions: { canCreate: true, canApprove: true, isActive: true } },
  { id: 'bidder', name: 'Bidder', username: 'sam', email: 'bidder@example.com', role: 'bidder', createdAt: new Date(), isApproved: true, permissions: { canCreate: false, canApprove: false, isActive: true } },
];
const defaultPasswords: Record<string, string> = { admin: 'admin00', teno: 'tender00', sam: 'sam00' };

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [users, setUsers] = useState<User[]>([]);
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

  const createOfficer = async (
    name: string,
    username: string,
    email: string
  ): Promise<boolean> => {
    try {
      // Generate a temporary password
      const tempPassword = `officer${Date.now().toString().slice(-6)}`;
      
      // Create officer in blockchain
      const success = await addOfficer(username, name, email);
      if (!success) {
        throw new Error("Failed to create officer on blockchain");
      }

      // Create local user object
      const newOfficer: User = {
        id: `officer-${Date.now()}`,
        name,
        username,
        email,
        role: "officer",
        createdAt: new Date(),
        isApproved: true,
        walletAddress: undefined,
        permissions: {
          canCreate: true,
          canApprove: true,
          isActive: true
        }
      };

      // Update users array
      const updatedUsers = [...users, newOfficer];
      setUsers(updatedUsers);
      persistUsers(updatedUsers);

      // Update password map
      const passwordMap = { ...PASSWORD_MAP };
      passwordMap[username] = tempPassword;
      persistPasswordMap(passwordMap);

      // Show success message with temporary password
      toast({
        title: "Officer Created",
        description: `Temporary password: ${tempPassword}`,
      });

      return true;
    } catch (error) {
      console.error("Error creating officer:", error);
      toast({
        title: "Error",
        description: "Failed to create officer",
        variant: "destructive",
      });
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      toast({
        title: "Login Attempt",
        description: account ? `Wallet: ${account}` : "No wallet connected",
        variant: "info"
      });
      console.log("[DEBUG] Login attempt with account:", account);
      // Always sync officers from blockchain before login
      await syncOfficersFromBlockchain();
      console.log("[DEBUG] Users after sync in login:", users);
      toast({
        title: "Users Synced (Login)",
        description: `Users: ${users.map(u => u.username).join(", ")}`,
        variant: "info"
      });
      if (!users || users.length === 0) {
        toast({
          title: "No Users Found",
          description: "No users are available on the blockchain. Please ask the admin to initialize users.",
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, isLoading: false, error: "No users found" }));
        return false;
      }
      // Find user
      const user = users.find(u => u.username === username);
      if (!user) {
        toast({
          title: "User Not Found",
          description: `Username: ${username} not found in users: ${users.map(u => u.username).join(", ")}`,
          variant: "destructive"
        });
        throw new Error("Invalid username or password");
      }
      // Check password
      if (PASSWORD_MAP[username] !== password) {
        toast({
          title: "Password Mismatch",
          description: `Password provided for ${username} does not match PASSWORD_MAP entry.`,
          variant: "destructive"
        });
        throw new Error("Invalid username or password");
      }
      // Connect wallet if not connected
      if (!isConnected) {
        await connectWallet();
      }
      if (!account) {
        throw new Error("Failed to connect wallet");
      }
      // Update user with wallet address
      const updatedUser = {
        ...user,
        walletAddress: account
      };
      const updatedUsers = users.map(u => 
        u.id === user.id ? updatedUser : u
      );
      setUsers(updatedUsers);
      toast({
        title: "Success",
        description: `Welcome back, ${updatedUser.name}!`,
      });
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        error: error.message
      }));
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
      return false;
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
    notifyOfficers(`User ${fields.name ?? authState.user?.name} resubmitted profile for approval.`, id);
  };

  const updateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };

  const syncOfficersFromBlockchain = async () => {
    try {
      const officers = await getAllOfficers();
      console.log("Fetched officers:", officers);
      
      // Map officers to local state
      const officerUsers = officers.map(officer => ({
        id: officer.id,
        name: officer.name,
        username: officer.username,
        email: officer.email,
        role: 'officer' as UserRole,
        walletAddress: officer.walletAddress,
        createdAt: new Date(),
        isApproved: officer.permissions.isActive,
        approvalRemark: '',
        permissions: {
          canCreate: officer.permissions.canCreate,
          canApprove: officer.permissions.canApprove,
          isActive: officer.permissions.isActive
        }
      }));

      // Add officers to users list if not already present
      const updatedUsers = [...users];
      for (const officer of officerUsers) {
        const existingUserIndex = updatedUsers.findIndex(u => 
          u.walletAddress?.toLowerCase() === officer.walletAddress.toLowerCase()
        );
        
        if (existingUserIndex === -1) {
          updatedUsers.push({
            ...officer,
            createdAt: new Date() // Ensure createdAt is a Date object
          });
        } else {
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            ...officer,
            createdAt: updatedUsers[existingUserIndex].createdAt // Keep original creation date
          };
        }
      }

      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error syncing officers:", error);
      toast({
        title: "Error",
        description: "Failed to sync officers from blockchain",
        variant: "destructive",
      });
    }
  };

  // Auto-fetch blockchain officers when wallet connects or network is correct
  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      syncOfficersFromBlockchain();
    }
  }, [isConnected, isCorrectNetwork]);

  // Initialize users from blockchain
  // Replace with your actual admin address (deployer address from Hardhat)
  const ADMIN_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase();

  const isAdmin = account && account.toLowerCase() === ADMIN_ADDRESS;

  const initializeUsers = async () => {
    try {
      toast({
        title: "Connected Account",
        description: account ? `Current wallet: ${account}` : "No wallet connected",
        variant: "info"
      });
      console.log("[DEBUG] Connected account:", account);
      // First sync from blockchain
      await syncOfficersFromBlockchain();
      console.log("[DEBUG] Users after blockchain sync:", users);
      toast({
        title: "Users Synced",
        description: `Users after sync: ${users.map(u => u.username).join(", ")}`,
        variant: "info"
      });
      // If no users exist, seed default users (only if admin is connected)
      if (users.length === 0) {
        if (!isAdmin) {
          toast({
            title: "Admin Wallet Required",
            description: "Please connect the admin/deployer wallet to initialize default users.",
            variant: "destructive"
          });
          console.log("[DEBUG] Not admin, skipping default user creation.");
          return;
        }
        // Create admin user on blockchain
        await createOfficer('Admin', 'admin', 'admin@example.com');
        // Create officer user on blockchain
        await createOfficer('Officer', 'teno', 'officer@example.com');
        // Create bidder user on blockchain
        await createOfficer('Bidder', 'sam', 'bidder@example.com');
        toast({
          title: "Default Users Initialized",
          description: `Admin, Officer, and Bidder created on-chain by ${account}`,
          variant: "success"
        });
        console.log("[DEBUG] Default users created by:", account);
      }
      console.log("[DEBUG] Users after initialization:", users);
      toast({
        title: "Users Synced",
        description: `Users after init: ${users.map(u => u.username).join(", ")}`,
        variant: "info"
      });
    } catch (error: any) {
      console.error("Error initializing users:", error);
      toast({ 
        title: "Error", 
        description: "Failed to initialize user data",
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork && officerContract && signer) {
      initializeUsers();
    }
  }, [isConnected, isCorrectNetwork, officerContract, signer]);

  // Removed localStorage user bootstrapping as all user data now comes from blockchain
  useEffect(() => {
    setAuthState({
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
