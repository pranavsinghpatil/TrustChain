import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Coins, Clock } from "lucide-react";

interface TenderCardProps {
  id: string;
  title: string;
  department: string;
  budget: string;
  deadline: string;
  status: 'open' | 'closed' | 'awarded' | 'disputed';
  bidCount: number;
}

const TenderCard = ({ id, title, department, budget, deadline, status, bidCount }: TenderCardProps) => {
  const getStatusBadge = (status: 'open' | 'closed' | 'awarded' | 'disputed') => {
    switch (status) {
      case 'open':
        return <Badge className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black">Open</Badge>;
      case 'closed':
        return <Badge className="bg-[rgba(156,163,175,0.8)] hover:bg-[rgba(156,163,175,0.9)] text-white">Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-[rgba(59,130,246,0.8)] hover:bg-[rgba(59,130,246,0.9)] text-white">Awarded</Badge>;
      case 'disputed':
        return <Badge className="bg-[rgba(239,68,68,0.8)] hover:bg-[rgba(239,68,68,0.9)] text-white">Disputed</Badge>;
    }
  };
  
  const isDeadlineSoon = () => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && status === 'open';
  };

  // Format budget to display ₹ symbol
  const formatBudget = (budgetString: string) => {
    // Extract numeric value and convert to INR format
    const numericValue = budgetString.replace(/[^0-9]/g, '');
    if (numericValue) {
      return `₹${parseInt(numericValue).toLocaleString('en-IN')}`;
    }
    return budgetString;
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <div className="px-6 py-4 border-b border-green-800">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          {getStatusBadge(status)}
        </div>
        <p className="text-sm text-gray-400 mt-1">{department}</p>
      </div>
      
      <div className="px-6 py-5 flex-grow">
        <div className="space-y-4">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-2 text-[rgba(80,252,149,0.8)]" />
            <span className="text-sm text-gray-300">Budget: <span className="font-medium text-white">{formatBudget(budget)}</span></span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-[rgba(80,252,149,0.8)]" />
            <span className="text-sm text-gray-300">Deadline: <span className="font-medium text-white">{deadline}</span></span>
          </div>
          
          {isDeadlineSoon() && (
            <div className="flex items-center text-[rgba(239,68,68,0.8)]">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Closing soon!</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm">
          <span className="text-gray-400">{bidCount} bid{bidCount !== 1 ? 's' : ''} submitted</span>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-green-800/30">
        <div className="flex justify-between w-full">
          <Button 
            variant="outline" 
            asChild
            className="border-green-800 text-black bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] transition-all duration-300 min-w-[120px] h-10"
          >
            <Link to={`/tenders/${id}`}>View Details</Link>
          </Button>
          {status === 'open' && (
            <Button 
              className="ml-2 bg-[rgba(59,130,246,0.8)] hover:bg-[rgba(59,130,246,0.9)] text-white transition-all duration-300 min-w-[120px] h-10" 
              asChild
            >
              <Link to={`/tenders/${id}/bid`}>Submit Bid</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderCard;
