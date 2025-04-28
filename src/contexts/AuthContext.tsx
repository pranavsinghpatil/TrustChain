import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, AuthState } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, role: UserRole, name: string, walletAddress: string, email?: string) => Promise<boolean>;
  users: User[];
  createOfficer: (name: string, username: string, password: string) => void;
  updateOfficer: (id: string, name: string) => void;
  removeOfficer: (id: string) => void;
  approveUser: (id: string) => void;
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
  const initialUsers: User[] = DEMO_USERS.map(u => ({ ...u, isApproved: u.role === 'bidder' ? false : true }));
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

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

  const register = async (
    username: string,
    password: string,
    role: UserRole,
    name: string,
    walletAddress: string,
    email?: string
  ): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Check if username already exists
      if (users.some(u => u.username === username)) {
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
        name,
        username,
        walletAddress,
        email,
        role,
        isApproved: role === 'bidder' ? false : true,
        createdAt: new Date(),
      };
      
      // Add user to demo users array (in a real app, this would be saved to a database)
      setUsers(prev => [...prev, newUser]);
      PASSWORD_MAP[username] = password;
      
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
    setUsers(prev => [...prev, newOfficer]);
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
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u));
    toast({ title: 'User approved', description: 'User access granted' });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, register, users, createOfficer, updateOfficer, removeOfficer, approveUser }}>
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
