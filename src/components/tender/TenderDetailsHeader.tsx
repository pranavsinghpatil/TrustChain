import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, IndianRupee, Building, FileText, Share2 } from "lucide-react";
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
  bidCount?: number;
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
        return <Badge className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black">Open for Bidding</Badge>;
      case 'closed':
        return <Badge className="bg-[rgba(156,163,175,0.8)] hover:bg-[rgba(156,163,175,0.9)] text-white">Bidding Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-[rgba(59,130,246,0.8)] hover:bg-[rgba(59,130,246,0.9)] text-white">Contract Awarded</Badge>;
      case 'disputed':
        return <Badge className="bg-[rgba(239,68,68,0.8)] hover:bg-[rgba(239,68,68,0.9)] text-white">Under Dispute</Badge>;
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
    <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-green-800">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusBadge(status)}
              <span className="text-sm text-gray-400">ID: {id}</span>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <div className="flex items-center mb-2">
              <Building className="h-4 w-4 mr-2 text-[rgba(80,252,149,0.8)]" />
              <span className="text-gray-300">{department}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {documentUrl && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-green-800 text-black bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80, 189, 252, 0.8)] transition-colors"
              >
                <FileText className="h-4 w-4" />
                View Documents
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-green-800 text-black bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80, 189, 252, 0.8)] transition-colors" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            {status === 'open' && (
              <Button className="bg-[rgba(59,130,246,0.8)] hover:bg-[rgba(59,130,246,0.9)] text-white" asChild>
                <Link to={`/tenders/${id}/bid`}>
                  Submit Bid
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4 border border-green-800/30">
            <div className="flex items-center mb-2">
              <IndianRupee className="h-5 w-5 mr-2 text-[rgba(80,252,149,0.8)]" />
              <p className="text-sm font-medium text-white">Budget</p>
            </div>
            <p className="text-lg font-semibold text-white">{budget}</p>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4 border border-green-800/30">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 mr-2 text-[rgba(80,252,149,0.8)]" />
              <p className="text-sm font-medium text-white">Deadline</p>
            </div>
            <p className="text-lg font-semibold text-white">{deadline}</p>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4 border border-green-800/30">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 mr-2 text-[rgba(80,252,149,0.8)]" />
              <p className="text-sm font-medium text-white">Time Remaining</p>
            </div>
            <p className="text-lg font-semibold text-white">{timeRemaining()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDetailsHeader;
