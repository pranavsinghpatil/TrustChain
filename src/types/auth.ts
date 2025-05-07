export type UserRole = "admin" | "officer" | "user" | "bidder";

// Payload for user registration
export interface RegisterData {
  username: string;
  password: string;
  confirmPassword?: string;
  name: string;
  role: UserRole;
  email: string;
  mobileNumber: string;
  walletAddress?: string;
  
  // Company Details
  bidderType: "Indian" | "Foreign";
  companyName: string;
  registrationNumber: string;
  gstNumber?: string;
  panNumber?: string;
  establishmentYear: string;
  
  // Address Details
  registeredAddress: string;
  city: string;
  state: string;
  pinCode: string;
  
  // Additional Information
  additionalInfo?: string;
  
  // Captcha and Terms
  terms1: boolean;
  terms2: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  username: string;
  role: UserRole;
  isApproved?: boolean;
  approvalRemark?: string;
  createdAt: Date;
  walletAddress?: string;
  profileData?: RegisterData;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface Notification {
  id: string;
  recipientId: string;          // user id for whom notification is intended
  message: string;              // notification content
  relatedUserId?: string;       // e.g. user id for approval actions
  isRead: boolean;              // mark if read
  createdAt: Date;
}
