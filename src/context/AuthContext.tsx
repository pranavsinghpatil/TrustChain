import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from './Web3Context';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'admin' | 'tenderofficer' | 'user' | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  currentUser: string | null;
}

interface UserCredentials {
  password: string;
  role: 'admin' | 'tenderofficer' | 'user';
}

const defaultCredentials: Record<string, UserCredentials> = {
  admin1: { password: 'admin00', role: 'admin' },
  tenderofficer: { password: 'ten00', role: 'tenderofficer' },
  sam: { password: 'sam00', role: 'user' }
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  login: async () => {},
  logout: () => {},
  currentUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, isConnected } = useWeb3();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'tenderofficer' | 'user' | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    const userCreds = defaultCredentials[username];
    
    if (!userCreds) {
      throw new Error('User not found');
    }

    if (userCreds.password !== password) {
      throw new Error('Invalid password');
    }

    setUserRole(userCreds.role);
    setCurrentUser(username);
    setIsAuthenticated(true);
    localStorage.setItem('userRole', userCreds.role);
    localStorage.setItem('currentUser', username);
  };

  const logout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as 'admin' | 'tenderofficer' | 'user' | null;
    const savedUser = localStorage.getItem('currentUser');
    if (savedRole && savedUser) {
      setUserRole(savedRole);
      setCurrentUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        login,
        logout,
        currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 