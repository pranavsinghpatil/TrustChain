export type UserRole = "admin" | "officer" | "bidder";

export interface User {
  id: string;
  name: string;
  email?: string;
  username: string;
  role: UserRole;
  isApproved?: boolean;
  createdAt: Date;
  walletAddress?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
