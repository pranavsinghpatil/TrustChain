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
  register: (data: RegisterData) => Promise<boolean>;
  createOfficer: (name: string, username: string, email: string) => Promise<boolean>;
  updateOfficer: (id: string, fields: { name?: string; username?: string; email?: string; walletAddress?: string }) => void;
  removeOfficer: (id: string) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string, reason: string) => void;
  notifyUser: (recipientId: string, message: string, relatedUserId?: string) => void;
  notifyOfficers: (message: string, relatedUserId?: string) => void;
  markNotificationRead: (id: string) => void;
  syncOfficersFromBlockchain: () => Promise<void>;
  connectOfficerWallet: (username: string, password: string) => Promise<boolean>;
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
      const storedPasswords = localStorage.getItem("trustchain_passwords");
      const passwordMap = storedPasswords ? JSON.parse(storedPasswords) : {};
      passwordMap[username] = tempPassword;
      localStorage.setItem("trustchain_passwords", JSON.stringify(passwordMap));

      // Show success message with temporary password
      toast({
        title: "Officer Created",
        description: `Officer account created with temporary password: ${tempPassword}`,
        duration: 10000, // Show for 10 seconds
      });

      return true;
    } catch (error: any) {
      console.error("Error creating officer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create officer",
        variant: "destructive",
      });
      return false;
    }
  };

  const connectOfficerWallet = async (username: string, password: string): Promise<boolean> => {
    try {
      // Verify credentials first
      const user = users.find(u => u.username === username);
      if (!user) {
        throw new Error("Invalid username");
      }

      const storedPasswords = localStorage.getItem("trustchain_passwords");
      const passwordMap = storedPasswords ? JSON.parse(storedPasswords) : {};
      
      if (passwordMap[username] !== password) {
        throw new Error("Invalid password");
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
      persistUsers(updatedUsers);

      // Update blockchain
      await updateBlockchainOfficer(account, user.name, user.username, user.email);

      toast({
        title: "Success",
        description: "Wallet connected successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error connecting officer wallet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Find user
      const user = users.find(u => u.username === username);
      if (!user) {
        throw new Error("Invalid username or password");
      }

      // Check password
      const storedPasswords = localStorage.getItem("trustchain_passwords");
      const passwordMap = storedPasswords ? JSON.parse(storedPasswords) : {};
      
      if (passwordMap[username] !== password) {
        throw new Error("Invalid username or password");
      }

      // For officers, verify blockchain status
      if (user.role === "officer") {
        // Connect wallet if not connected
        if (!isConnected) {
          const connected = await connectWallet();
          if (!connected) {
            throw new Error("Failed to connect wallet");
          }
        }

        if (!account) {
          throw new Error("Wallet not connected");
        }

        // Sync officer data from blockchain
        await syncOfficersFromBlockchain();

        // Find the officer in our updated users list
        const officerUser = users.find(u => 
          u.walletAddress?.toLowerCase() === account.toLowerCase() && 
          u.role === 'officer'
        );

        if (!officerUser) {
          throw new Error("Officer not found in blockchain. Please contact admin.");
        }

        if (!officerUser.permissions?.isActive) {
          throw new Error("Your account is currently inactive. Please contact admin.");
        }

        // Update user with blockchain data
        user.walletAddress = account;
        user.permissions = officerUser.permissions;
      }

      // Login successful
      const loggedInUser = {
        ...user,
        createdAt: new Date(user.createdAt)
      };

      setAuthState({
        user: loggedInUser,
        isLoading: false,
        error: null
      });

      // Update users array
      const updatedUsers = users.map(u => 
        u.id === user.id ? loggedInUser : u
      );
      setUsers(updatedUsers);
      persistUsers(updatedUsers);

      localStorage.setItem("user", JSON.stringify(loggedInUser));
      
      toast({
        title: "Success",
        description: `Welcome back, ${loggedInUser.name}!`,
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
        email: data.email,
        role: data.role,
        isApproved: data.role === 'user' ? false : true,
        createdAt: new Date(),
        profileData: data,
        permissions: {
          canCreate: false,
          canApprove: false,
          isActive: false
        }
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

  const rejectUser = (id: string, reason: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: false, approvalRemark: reason } : u));
    notifyUser(id, `Approval reverted: ${reason}`, id);
    const user = users.find(u => u.id === id);
    if (user) notifyOfficers(`User ${user.name} has updated details and awaits re-approval.`, id);
    toast({ title: 'Approval reverted', description: `User remark: ${reason}` });
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
      persistUsers(updatedUsers);
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

  useEffect(() => {
    // Initialize users from localStorage
    const initializeUsers = () => {
      try {
        const storedUsers = localStorage.getItem("trustchain_users");
        const storedPasswords = localStorage.getItem("trustchain_passwords");
        const parsedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        const parsedPasswords: Record<string, string> = storedPasswords ? JSON.parse(storedPasswords) : {};
        const shouldSeed = !storedUsers || !storedPasswords || parsedUsers.length !== defaultUsers.length;
        if (shouldSeed) {
          // Seed default users and passwords
          setUsers(defaultUsers);
          persistUsers(defaultUsers);
          Object.assign(PASSWORD_MAP, defaultPasswords);
          persistPasswordMap(defaultPasswords);
          console.log("Default users seeded:", defaultUsers.map(u => u.username));
        } else {
          setUsers(parsedUsers);
          Object.assign(PASSWORD_MAP, parsedPasswords);
          console.log("Loaded stored users:", parsedUsers.map((u: any) => u.username));
        }
      } catch (error) {
        console.error("Error initializing users:", error);
        toast({ title: "Error", description: "Failed to initialize user data", variant: "destructive" });
      }
    };

    initializeUsers();
  }, []);

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
        register,
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
        connectOfficerWallet,
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
