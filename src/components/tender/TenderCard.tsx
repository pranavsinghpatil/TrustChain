
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
        return <Badge className="bg-blockchain-green text-white">Open</Badge>;
      case 'closed':
        return <Badge className="bg-blockchain-gray text-white">Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-blockchain-purple text-white">Awarded</Badge>;
      case 'disputed':
        return <Badge className="bg-blockchain-red text-white">Disputed</Badge>;
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
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {getStatusBadge(status)}
        </div>
        <p className="text-sm text-gray-500">{department}</p>
      </CardHeader>
      <CardContent className="pb-4 flex-grow">
        <div className="space-y-3">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-2 text-blockchain-blue" />
            <span className="text-sm">Budget: <span className="font-medium">{formatBudget(budget)}</span></span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blockchain-blue" />
            <span className="text-sm">Deadline: <span className="font-medium">{deadline}</span></span>
          </div>
          
          {isDeadlineSoon() && (
            <div className="flex items-center text-blockchain-red">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Closing soon!</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm">
          <span className="text-gray-500">{bidCount} bid{bidCount !== 1 ? 's' : ''} submitted</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" asChild>
            <Link to={`/tenders/${id}`}>View Details</Link>
          </Button>
          {status === 'open' && (
            <Button className="ml-2 bg-blockchain-blue hover:bg-blockchain-purple" asChild>
              <Link to={`/tenders/${id}/bid`}>Submit Bid</Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TenderCard;
