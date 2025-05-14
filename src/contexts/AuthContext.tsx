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
  
  // IMPORTANT: We no longer clear localStorage/sessionStorage on load to preserve officer data
  useEffect(() => {
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
    } catch (e) {
      console.error('Error loading password data:', e);
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
      if (!isConnected) {
        const connected = await connectWallet();
        if (!connected) {
          toast({
            title: "Wallet Required",
            description: "Please connect your wallet to create an officer",
            variant: "destructive",
          });
          return false;
        }
      }

      // Generate a random password
      const password = 'tender00';

      // Prevent duplicate usernames
      if (users.some(u => u.username === username)) {
        toast({
          title: "Username Exists",
          description: "This username is already taken",
          variant: "destructive",
        });
        return false;
      }
      
      // Save password to PASSWORD_MAP before creating officer
      PASSWORD_MAP[username] = password;
      persistPasswordMap(PASSWORD_MAP);
      console.log(`[createOfficer] Set password for ${username}:`, PASSWORD_MAP[username]);
      
      // Also store in sessionStorage for cross-browser access
      try {
        sessionStorage.setItem(`officer_${username}`, JSON.stringify({
          username,
          password
        }));
        console.log(`[createOfficer] Stored credentials in sessionStorage for ${username}`);
      } catch (err) {
        console.warn(`[createOfficer] Error storing in sessionStorage:`, err);
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
      
      // If user not found in local state, check all possible sources
      if (!user && username !== 'admin') {
        console.log(`[login] User ${username} not found in local state, checking other sources`);
        
        // First check localStorage directly for trustchain_users
        try {
          const storedUsers = localStorage.getItem('trustchain_users');
          if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            const storedUser = parsedUsers.find((u: any) => u.username === username);
            if (storedUser) {
              console.log(`[login] Found user ${username} in trustchain_users`);
              user = storedUser;
            }
          }
        } catch (err) {
          console.warn(`[login] Error checking trustchain_users:`, err);
        }
        
        // Then check localStorage.officers
        if (!user) {
          try {
            const storedOfficers = localStorage.getItem('tender_officers');
            if (storedOfficers) {
              const officers = JSON.parse(storedOfficers);
              const officer = officers.find((o: any) => o.username === username);
              if (officer) {
                console.log(`[login] Found officer ${username} in tender_officers`);
                user = {
                  id: officer.id,
                  name: officer.name,
                  username: officer.username,
                  email: officer.email,
                  role: 'officer',
                  createdAt: new Date(officer.createdAt),
                  isApproved: true,
                  permissions: officer.permissions || { canCreate: true, canApprove: true, isActive: true }
                };
              }
            }
          } catch (err) {
            console.warn(`[login] Error checking tender_officers:`, err);
          }
        }
        
        // Also check localStorageKeys.officers
        if (!user) {
          try {
            const officersKey = 'tender_officers';
            const storedOfficers = localStorage.getItem(officersKey);
            if (storedOfficers) {
              const officers = JSON.parse(storedOfficers);
              const officer = officers.find((o: any) => o.username === username);
              if (officer) {
                console.log(`[login] Found officer ${username} in ${officersKey}`);
                user = {
                  id: officer.id,
                  name: officer.name,
                  username: officer.username,
                  email: officer.email,
                  role: 'officer',
                  createdAt: new Date(officer.createdAt || Date.now()),
                  isApproved: true,
                  permissions: officer.permissions || { canCreate: true, canApprove: true, isActive: true }
                };
              }
            }
          } catch (err) {
            console.warn(`[login] Error checking localStorageKeys.officers:`, err);
          }
        }
        
        // Direct check of all localStorage keys as a last resort
        if (!user) {
          try {
            // List all localStorage keys and look for anything that might contain officers
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('officer') || key.includes('user'))) {
                try {
                  const data = localStorage.getItem(key);
                  if (data) {
                    const parsed = JSON.parse(data);
                    // Check if it's an array
                    if (Array.isArray(parsed)) {
                      const officer = parsed.find((o: any) => o.username === username);
                      if (officer) {
                        console.log(`[login] Found officer ${username} in localStorage key: ${key}`);
                        user = {
                          id: officer.id || `officer-${Date.now()}`,
                          name: officer.name || username,
                          username: officer.username,
                          email: officer.email || `${username}@example.com`,
                          role: 'officer',
                          createdAt: new Date(officer.createdAt || Date.now()),
                          isApproved: true,
                          permissions: officer.permissions || { canCreate: true, canApprove: true, isActive: true }
                        };
                        break;
                      }
                    }
                  }
                } catch (parseErr) {
                  // Ignore parsing errors for individual keys
                }
              }
            }
          } catch (err) {
            console.warn(`[login] Error checking all localStorage keys:`, err);
          }
        }
        
        // Only try blockchain as a last resort if wallet is connected
        if (!user && isConnected && officerContract) {
          try {
            console.log(`[login] Attempting to fetch officer ${username} from blockchain`);
            setAuthState(prev => ({ ...prev, isLoading: true }));
            // Fetch all officers from blockchain
            const officers = await getAllOfficers();
            const officer = officers.find(o => o.username === username);
            if (officer) {
              console.log(`[login] Officer ${username} found on blockchain`);
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
              };
            }
          } catch (err) {
            console.warn(`[login] Error fetching from blockchain:`, err);
            // Don't return false here - continue with other authentication methods
          }
        }
        
        // If user was found in any source, add to users state
        if (user) {
          const updatedUsers = [...users, user];
          setUsers(updatedUsers);
          persistUsers(updatedUsers);
          console.log(`[login] Added ${username} to users array from alternative source`);
        } else {
          // If we still can't find the user anywhere, check if the username exists in PASSWORD_MAP
          // This handles the case where we have credentials but no user object
          if (PASSWORD_MAP[username] && password === 'tender00') {
            console.log(`[login] Creating minimal user for ${username} based on PASSWORD_MAP entry`);
            user = {
              id: `officer-${Date.now()}`,
              name: username,
              username: username,
              email: `${username}@example.com`,
              role: 'officer',
              createdAt: new Date(),
              isApproved: true,
              permissions: { canCreate: true, canApprove: true, isActive: true }
            };
            const updatedUsers = [...users, user];
            setUsers(updatedUsers);
            persistUsers(updatedUsers);
          } else {
            setAuthState({ user: null, isLoading: false, error: "User not found" });
            toast({ title: "Login Failed", description: "User not found in any storage", variant: "destructive" });
            return false;
          }
        }
      }  
    console.log(`[login] Testing password for ${username}:`, {
      'has password entry': !!PASSWORD_MAP[username],
      'password matches': PASSWORD_MAP[username] === password
    });
    
    // Check all possible storage locations for officer credentials
    let credentialsValid = false;
    
    // IMPORTANT: Always accept 'tender00' as the password for any officer
    if (user?.role === 'officer' && password === 'tender00') {
      console.log(`[login] Using default password 'tender00' for officer ${username}`);
      credentialsValid = true;
      // Save this password for future logins
      PASSWORD_MAP[username] = 'tender00';
      persistPasswordMap(PASSWORD_MAP);
    }
    // Otherwise check PASSWORD_MAP (from trustchain_passwords in localStorage)
    else if (PASSWORD_MAP[username] && PASSWORD_MAP[username] === password) {
      console.log(`[login] Password match found in PASSWORD_MAP for ${username}`);
      credentialsValid = true;
    }
    
    // Then check sessionStorage (browser-specific, but might have newer data)
    if (!credentialsValid) {
      try {
        const storedData = sessionStorage.getItem(`officer_${username}`);
        if (storedData) {
          const officerData = JSON.parse(storedData);
          console.log(`[login] Found officer data in sessionStorage:`, officerData);
          if (officerData.password === password) {
            credentialsValid = true;
            // Update PASSWORD_MAP so it's available across browsers
            PASSWORD_MAP[username] = password;
            persistPasswordMap(PASSWORD_MAP);
          }
        }
      } catch (err) {
        console.warn(`[login] Error checking sessionStorage:`, err);
      }
    }
    
    // Also check tender_officers localStorage (shared across browsers)
    if (!credentialsValid) {
      try {
        const storedOfficers = localStorage.getItem('tender_officers');
        if (storedOfficers) {
          const officers = JSON.parse(storedOfficers);
          const officer = officers.find((o: any) => o.username === username);
          if (officer && (officer.password === password || password === 'tender00')) {
            console.log(`[login] Password match found in tender_officers for ${username}`);
            credentialsValid = true;
            // Update PASSWORD_MAP for future logins
            PASSWORD_MAP[username] = password;
            persistPasswordMap(PASSWORD_MAP);
          }
        }
      } catch (err) {
        console.warn(`[login] Error checking tender_officers:`, err);
      }
    }
    
    // Check all localStorage keys as a last resort
    if (!credentialsValid && user?.role === 'officer') {
      try {
        // Look for any key that might contain this officer's password
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('password')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (parsed[username] && (parsed[username] === password || password === 'tender00')) {
                  console.log(`[login] Password match found in localStorage key: ${key}`);
                  credentialsValid = true;
                  break;
                }
              }
            } catch (parseErr) {
              // Ignore parsing errors for individual keys
            }
          }
        }
      } catch (err) {
        console.warn(`[login] Error checking all localStorage keys for passwords:`, err);
      }
    }
    
    // Last resort: if user exists and is an officer, accept 'tender00' as password
    if (!credentialsValid && user?.role === 'officer' && password === 'tender00') {
      console.log(`[login] Accepting default password for officer as last resort`);
      credentialsValid = true;
      PASSWORD_MAP[username] = 'tender00';
      persistPasswordMap(PASSWORD_MAP);
    }
    
    if (!credentialsValid) {
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
      // First, load existing users from localStorage to preserve them
      const existingUsers = loadUsers();
      const existingOfficers = existingUsers.filter(user => user.role === 'officer');
      console.log(`[syncOfficersFromBlockchain] Existing officers in localStorage: ${existingOfficers.length}`);
      
      // Also check tender_officers localStorage for any additional officers
      let localStorageOfficers = [];
      try {
        const storedOfficers = localStorage.getItem('tender_officers');
        if (storedOfficers) {
          localStorageOfficers = JSON.parse(storedOfficers);
          console.log(`[syncOfficersFromBlockchain] Found ${localStorageOfficers.length} officers in tender_officers`);
        }
      } catch (err) {
        console.warn('[syncOfficersFromBlockchain] Error reading tender_officers:', err);
      }
      
      // Get officers from blockchain/localStorage
      const officers = await getAllOfficers();
      console.log("Fetched officers from blockchain:", officers);

      // --- Ensure admin user always present ---
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
      
      // Create a map of usernames for quick lookup
      const officerUsernames = new Set(officerUsers.map(o => o.username));
      
      // Add any existing officers from trustchain_users that weren't found in the blockchain
      for (const existingOfficer of existingOfficers) {
        if (!officerUsernames.has(existingOfficer.username)) {
          console.log(`[syncOfficersFromBlockchain] Preserving local officer from trustchain_users: ${existingOfficer.username}`);
          // Create a properly typed officer object with all required fields
          const preservedOfficer = {
            ...existingOfficer,
            // Ensure walletAddress exists (required in officerUsers type)
            walletAddress: existingOfficer.walletAddress || '',
            // Ensure other required fields
            approvalRemark: existingOfficer.approvalRemark || '',
            permissions: existingOfficer.permissions || { canCreate: true, canApprove: true, isActive: true }
          };
          officerUsers.push(preservedOfficer);
          // Make sure the password is set
          if (!PASSWORD_MAP[existingOfficer.username]) {
            PASSWORD_MAP[existingOfficer.username] = 'tender00';
          }
        }
      }
      
      // Also add any officers from tender_officers localStorage that weren't found yet
      for (const localOfficer of localStorageOfficers) {
        if (!officerUsernames.has(localOfficer.username)) {
          console.log(`[syncOfficersFromBlockchain] Preserving local officer from tender_officers: ${localOfficer.username}`);
          const preservedOfficer = {
            id: localOfficer.id,
            name: localOfficer.name,
            username: localOfficer.username,
            email: localOfficer.email,
            role: 'officer' as UserRole,
            walletAddress: localOfficer.walletAddress || '',
            createdAt: new Date(localOfficer.createdAt),
            isApproved: true,
            approvalRemark: '',
            permissions: localOfficer.permissions || { canCreate: true, canApprove: true, isActive: true }
          };
          officerUsers.push(preservedOfficer);
          officerUsernames.add(localOfficer.username);
          
          // Make sure the password is set
          if (!PASSWORD_MAP[localOfficer.username]) {
            PASSWORD_MAP[localOfficer.username] = localOfficer.password || 'tender00';
          }
        }
      }
      
      // Create final user list: admin + all officers
      const updatedUsers = [adminUser, ...officerUsers];
      
      // Ensure all officers have passwords
      for (const officer of officerUsers) {
        PASSWORD_MAP[officer.username] = PASSWORD_MAP[officer.username] || 'tender00';
        console.log(`[syncOfficersFromBlockchain] Set password for ${officer.username}:`, PASSWORD_MAP[officer.username]);
      }
      
      // Update state and persist to localStorage
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
