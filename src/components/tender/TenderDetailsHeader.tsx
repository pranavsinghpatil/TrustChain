
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, DollarSign, Building, FileText, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TenderDetailsHeaderProps {
  id: string;
  title: string;
  department: string;
  budget: string;
  deadline: string;
  status: 'open' | 'closed' | 'awarded' | 'disputed';
  createdAt: string;
  documentUrl?: string;
}

const TenderDetailsHeader = ({ 
  id, 
  title, 
  department, 
  budget, 
  deadline, 
  status, 
  createdAt, 
  documentUrl 
}: TenderDetailsHeaderProps) => {
  const { toast } = useToast();

  const getStatusBadge = (status: 'open' | 'closed' | 'awarded' | 'disputed') => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blockchain-green text-white">Open for Bidding</Badge>;
      case 'closed':
        return <Badge className="bg-blockchain-gray text-white">Bidding Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-blockchain-purple text-white">Contract Awarded</Badge>;
      case 'disputed':
        return <Badge className="bg-blockchain-red text-white">Under Dispute</Badge>;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Tender URL copied to clipboard"
    });
  };

  const timeRemaining = () => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (now > deadlineDate) return "Deadline passed";
    
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${diffDays} days, ${diffHours} hours remaining`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {getStatusBadge(status)}
            <span className="text-sm text-gray-500">ID: {id}</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <div className="flex items-center mb-4">
            <Building className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">{department}</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-blockchain-blue" />
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium">{budget}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blockchain-blue" />
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="font-medium">{deadline}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blockchain-blue" />
              <div>
                <p className="text-sm text-gray-500">Time Remaining</p>
                <p className="font-medium">{timeRemaining()}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {documentUrl && (
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Documents
            </Button>
          )}
          
          <Button variant="outline" className="flex items-center gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          {status === 'open' && (
            <Button className="bg-blockchain-blue hover:bg-blockchain-purple" asChild>
              <Link to={`/tenders/${id}/bid`}>
                Submit Bid
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderDetailsHeader;
