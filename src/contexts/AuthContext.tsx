import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, AuthState, Notification, RegisterData } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  users: User[];
  createOfficer: (name: string, username: string, password: string) => void;
  updateOfficer: (id: string, name: string) => void;
  removeOfficer: (id: string) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string, remark: string) => void;
  updateUser: (id: string, fields: { name?: string; email?: string; password?: string }) => void;
  notifications: Notification[];
  notifyUser: (recipientId: string, message: string, relatedUserId?: string) => void;
  notifyOfficers: (message: string, relatedUserId?: string) => void;
  markNotificationRead: (id: string) => void;
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

// Password map for demonstration (in a real app, these would be hashed and stored securely)
const PASSWORD_MAP: Record<string, string> = {
  "admin": "admin00",
  "teno": "tender00",
  "sam": "sam00"
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { toast } = useToast();
  const initialUsers: User[] = DEMO_USERS.map(u => ({
    ...u,
    isApproved: u.username === 'sam' ? true : (u.role === 'bidder' ? false : true),
  }));
  const [users, setUsers] = useState<User[]>(initialUsers.map(u => ({ ...u, approvalRemark: '' })));
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Find user by username
      const user = users.find(u => u.username === username);
      
      if (!user || PASSWORD_MAP[username] !== password) {
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

  const createOfficer = (name: string, username: string, password: string) => {
    const newOfficer: User = { id: `officer-${Date.now()}`, name, username, role: 'officer', createdAt: new Date(), isApproved: true };
    setUsers(prev => [...prev, { ...newOfficer, approvalRemark: '' }]);
    PASSWORD_MAP[username] = password;
    toast({ title: 'Officer created', description: `${name} has been appointed` });
  };

  const updateOfficer = (id: string, name: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, name } : u));
    toast({ title: 'Officer updated', description: 'Officer details updated' });
  };

  const removeOfficer = (id: string) => {
    const officer = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    delete PASSWORD_MAP[officer?.username!];
    toast({ title: 'Officer removed', description: `${officer?.name} has been removed` });
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

  return (
    <AuthContext.Provider value={{ authState, login, logout, register, users, createOfficer, updateOfficer, removeOfficer, approveUser, rejectUser, updateUser, notifications, notifyUser, notifyOfficers, markNotificationRead }}>
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
