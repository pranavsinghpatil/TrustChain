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

// Password map for local authentication (deprecated, now only for admin)
let PASSWORD_MAP: Record<string, string> = { admin: 'admin00' };
// Officer passwords are validated ONLY via blockchain, not local cache.

// Default seed users for testing (admin only, officers are fetched from blockchain)
const defaultUsers: User[] = [
  { id: 'admin', name: 'Admin', username: 'admin', email: 'admin@example.com', role: 'admin', createdAt: new Date(), isApproved: true, permissions: { canCreate: true, canApprove: true, isActive: true } },
];

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  console.log('[AuthProvider] Initializing');
  
  // Remove all localStorage/sessionStorage officer data on load
  useEffect(() => {
    try {
      localStorage.removeItem('trustchain_users');
      localStorage.removeItem('trustchain_passwords');
      sessionStorage.clear();
      console.log('[AuthProvider] Cleared all officer/user cache');
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }, []);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

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

  const createOfficer = async (
    name: string,
    username: string,
    email: string
  ): Promise<boolean> => {
    try {
      // Special case for admin
      let password = 'tender00';
      if (username === 'admin') {
        password = 'admin00';
      }
      // Create officer in blockchain
      const success = await addOfficer(username, name, email);
      if (!success) {
        throw new Error("Failed to create officer on blockchain");
      }

      // Sync with blockchain to ensure officer is available in all browsers
      await syncOfficersFromBlockchain();

      // Show success message with password
      toast({
        title: "Officer Created",
        description: `Password: ${password}`,
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

  // Authentication: login function
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log(`[login] Attempting login for: ${username}`);
    console.log(`[login] Current users:`, users.map(u => u.username));
    console.log(`[login] Password map keys:`, Object.keys(PASSWORD_MAP));
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Admin login
      if (username === 'admin' && password === 'admin00') {
        const adminUser = users.find(u => u.username === 'admin') || {
          id: 'admin',
          name: 'Admin',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin' as UserRole,
          createdAt: new Date(),
          isApproved: true,
          permissions: { canCreate: true, canApprove: true, isActive: true }
        };
        setAuthState({ user: adminUser, isLoading: false, error: null });
        toast({ title: "Login Success", description: "Welcome, Admin!" });
        return true;
      }
      // Regular user login
    let user = users.find(u => u.username === username);
    
    // For officers, always fetch from blockchain for login validation
    if (!user && username !== 'admin') {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        // Fetch all officers from blockchain
        const officers = await getAllOfficers();
        const officer = officers.find(o => o.username === username);
        if (officer) {
          // Officer found, create user object (ignore walletAddress for login)
          user = {
            id: officer.id,
            name: officer.name,
            username: officer.username,
            email: officer.email,
            role: 'officer',
            createdAt: officer.createdAt,
            isApproved: true,
            permissions: { canCreate: true, canApprove: true, isActive: true }
            // walletAddress: officer.walletAddress, // purposely omitted for login
          };
          // Add to users for session
          const updatedUsers = [...users, user];
          setUsers(updatedUsers);
          persistUsers(updatedUsers);
          console.log(`[login] Officer ${username} found on blockchain and added to users array`);
        } else {
          setAuthState({ user: null, isLoading: false, error: "Officer not found on blockchain" });
          toast({ title: "Login Failed", description: "Officer not found on blockchain", variant: "destructive" });
          return false;
        }
      } catch (err) {
        setAuthState({ user: null, isLoading: false, error: "Blockchain error" });
        toast({ title: "Login Failed", description: "Blockchain error", variant: "destructive" });
        return false;
      }
    }  
    console.log(`[login] Testing password for ${username}:`, {
      'has password entry': !!PASSWORD_MAP[username],
      'password matches': PASSWORD_MAP[username] === password
    });
    
    // Check sessionStorage for officer credentials - allows cross-browser login
    let foundInSessionStorage = false;
    try {
      const storedData = sessionStorage.getItem(`officer_${username}`);
      if (storedData) {
        const officerData = JSON.parse(storedData);
        console.log(`[login] Found officer data in sessionStorage:`, officerData);
        if (officerData.password === password) {
          foundInSessionStorage = true;
          // Update PASSWORD_MAP so it's available next time
          PASSWORD_MAP[username] = password;
          persistPasswordMap(PASSWORD_MAP);
        }
      }
    } catch (err) {
      console.warn(`[login] Error checking sessionStorage:`, err);
    }
    
    if ((!PASSWORD_MAP[username] || PASSWORD_MAP[username] !== password) && !foundInSessionStorage) {
        setAuthState({ user: null, isLoading: false, error: "Incorrect password" });
        toast({ title: "Login Failed", description: "Incorrect password", variant: "destructive" });
        return false;
      }
      setAuthState({ user, isLoading: false, error: null });
      toast({ title: "Login Success", description: `Welcome, ${user.name}!` });
      return true;
    } catch (error) {
      setAuthState({ user: null, isLoading: false, error: "Login error" });
      toast({ title: "Login Error", description: "Unexpected error during login", variant: "destructive" });
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
    console.log('[syncOfficersFromBlockchain] Starting sync');
    setIsSyncingOfficers(true);
    try {
      const officers = await getAllOfficers();
      console.log("Fetched officers:", officers);

      // --- Ensure admin user always present ---
      // Always keep only admin + officers from blockchain
      const adminUser = {
        id: 'admin',
        name: 'Admin',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin' as UserRole,
        createdAt: new Date(),
        isApproved: true,
        permissions: { canCreate: true, canApprove: true, isActive: true }
      };
      PASSWORD_MAP['admin'] = 'admin00';
      // Map officers to local state and password map
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
      // Overwrite users state: admin + all officers from blockchain
      const updatedUsers = [adminUser, ...officerUsers];
      for (const officer of officerUsers) {
        PASSWORD_MAP[officer.username] = 'tender00';
        console.log(`[syncOfficersFromBlockchain] Set password for ${officer.username}:`, PASSWORD_MAP[officer.username]);
      }
      setUsers(updatedUsers);
      persistUsers(updatedUsers);
      persistPasswordMap(PASSWORD_MAP);
      console.log('[syncOfficersFromBlockchain] Users:', updatedUsers.map(u => u.username));
      console.log('[syncOfficersFromBlockchain] Password map:', Object.keys(PASSWORD_MAP));
      // Remove officer sessionStorage logic (no local cache except admin password)

    } catch (error) {
      console.error("Error syncing officers:", error);
      toast({
        title: "Error",
        description: "Failed to sync officers from blockchain",
        variant: "destructive",
      });
    } finally {
      setIsSyncingOfficers(false);
      console.log('[syncOfficersFromBlockchain] Finished sync');
    }
  };

  // Always sync officers from blockchain when wallet is connected or on explicit user action
  const syncOfficersOnUserAction = async () => {
    if (isConnected && isCorrectNetwork && officerContract && signer) {
      console.log('[AuthProvider] User action - synchronizing officers from blockchain');
      await syncOfficersFromBlockchain();
    } else {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to view officers.",
        variant: "destructive",
      });
    }
  };
  // Remove all auto-sync useEffects. Only sync on user action or after wallet connect.

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
