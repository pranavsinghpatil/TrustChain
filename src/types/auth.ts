export type UserRole = "admin" | "officer" | "bidder";

// Payload for user registration
export interface RegisterData {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  walletAddress: string;
  email: string;
  mobileNumber: string;
  companyName: string;
  registrationNumber: string;
  registeredAddress: string;
  partnersDirectors: string;
  bidderType: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  panNumber: string;
  establishmentYear: string;
  natureOfBusiness: string;
  legalStatus: string;
  companyCategory: string;
  contactPersonName: string;
  contactPersonTitle: string;
  contactDesignation: string;
  phoneNumber: string;
  dateOfBirth: string;
  dscCertificate: string;
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
