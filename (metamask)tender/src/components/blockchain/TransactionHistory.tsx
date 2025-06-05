import React from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, ExternalLink, FileText, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TransactionHistoryProps {
  userId?: string; // Optional - if not provided, shows current user's transactions
  limit?: number; // Optional - limit the number of transactions shown
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  userId,
  limit = 5
}) => {
  const { userTransactions } = useWeb3();
  const { authState } = useAuth();
  
  const currentUserId = userId || authState.user?.id;
  
  if (!currentUserId) {
    return (
      <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Transaction History</CardTitle>
          <CardDescription>Connect your wallet to view transaction history</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-gray-500 mb-2" />
          <p className="text-gray-400">No wallet connected</p>
        </CardContent>
      </Card>
    );
  }
  
  const transactions = userTransactions[currentUserId] || [];
  
  // Get transactions to display, sorted by timestamp (newest first)
  const displayTransactions = [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
  
  // Helper function to get transaction type badge
  const getTransactionBadge = (txType: string) => {
    switch (txType) {
      case 'create_tender':
        return <Badge className="bg-blue-500">Create Tender</Badge>;
      case 'submit_bid':
        return <Badge className="bg-green-500">Submit Bid</Badge>;
      case 'award_tender':
        return <Badge className="bg-purple-500">Award Tender</Badge>;
      case 'close_tender':
        return <Badge className="bg-orange-500">Close Tender</Badge>;
      case 'dispute':
        return <Badge className="bg-red-500">Dispute</Badge>;
      case 'wallet_connect':
        return <Badge className="bg-indigo-500">Wallet Connected</Badge>;
      default:
        return <Badge className="bg-gray-500">{txType}</Badge>;
    }
  };
  
  // Helper function to get transaction icon
  const getTransactionIcon = (txType: string) => {
    switch (txType) {
      case 'create_tender':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'submit_bid':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'award_tender':
        return <Shield className="h-4 w-4 text-purple-400" />;
      case 'close_tender':
        return <Clock className="h-4 w-4 text-orange-400" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };
  
  return (
    <Card className="bg-[#1B1B1B]/40 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Blockchain Transactions</CardTitle>
        <CardDescription>
          Recent blockchain transactions for this account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-400">No transactions found</p>
            <p className="text-xs text-gray-500 mt-1">
              Transactions will appear here when you interact with the blockchain
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((tx) => (
              <div 
                key={tx.txHash} 
                className="flex items-start justify-between p-3 border border-gray-800 rounded-md bg-black/20"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getTransactionIcon(tx.txType)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getTransactionBadge(tx.txType)}
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{tx.details}</p>
                    <a 
                      href={`https://etherscan.io/tx/${tx.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-400/80 font-mono flex items-center mt-1 hover:text-green-400"
                    >
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
