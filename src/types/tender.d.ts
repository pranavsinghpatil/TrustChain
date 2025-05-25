// Tender status types
export type TenderStatus = 'draft' | 'published' | 'in_progress' | 'evaluation' | 'awarded' | 'closed' | 'cancelled' | 'open' | 'disputed';

export interface Document {
  name: string;
  url: string;
  type: string;
  size: number;
  cid?: string;
}

export interface Bid {
  id: string;
  bidder: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
  description: string;
  createdAt: number;
}

export interface TenderBase {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: number;
  createdAt: number;
  startDate: number;
  endDate: number;
  creator: string;
  createdBy: string;
  status: TenderStatus;
  department: string;
  category: string;
  location: string;
  bidCount: number;
  notes: string;
  criteria: string[];
  documents: Document[];
  winner: string;
  isActive: boolean;
}

export interface Tender extends TenderBase {
  bids?: Bid[];
}

export interface TenderInput {
  title: string;
  description: string;
  department: string;
  budget: string;
  startDate?: number;
  deadline: number;
  criteria: string[];
  documents: Document[];
  category?: string;
  location?: string;
}

export interface FormattedTender extends Omit<Tender, 'budget' | 'deadline' | 'createdAt' | 'startDate' | 'endDate'> {
  formattedBudget: string;
  formattedDeadline: string;
  formattedCreatedAt: string;
  formattedStartDate: string;
  formattedEndDate: string;
  bids: Bid[];
}

export interface OfficerPermissions {
  canCreate: boolean;
  canApprove: boolean;
  isActive: boolean;
}

export interface Officer {
  id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  walletAddress: string;
  password?: string;
  permissions: OfficerPermissions;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (accounts: string[]) => void) => void;
      removeListener: (eventName: string, handler: (accounts: string[]) => void) => void;
      removeAllListeners: (eventName: string) => void;
    };
  }
}
