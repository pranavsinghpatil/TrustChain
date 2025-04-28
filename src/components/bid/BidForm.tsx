
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface BidFormProps {
  tenderId: string;
}

const BidForm = ({ tenderId }: BidFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Bid Submitted!",
        description: "Your bid has been encrypted and added to the blockchain",
      });
      navigate(`/tenders/${tenderId}`);
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bidAmount">Bid Amount (USD)</Label>
          <Input 
            id="bidAmount" 
            type="number" 
            placeholder="Enter your bid amount" 
            required 
            className="mt-1.5"
            min="1000"
          />
        </div>
        
        <div>
          <Label htmlFor="proposedTimeline">Proposed Timeline (Days)</Label>
          <Input 
            id="proposedTimeline" 
            type="number" 
            placeholder="Number of days to complete" 
            required 
            className="mt-1.5"
            min="1"
          />
        </div>
        
        <div>
          <Label htmlFor="technicalProposal">Technical Proposal</Label>
          <Textarea 
            id="technicalProposal" 
            placeholder="Describe your technical approach to fulfilling the tender requirements" 
            required 
            className="mt-1.5"
            rows={5}
          />
        </div>
        
        <div>
          <Label htmlFor="qualifications">Company Qualifications</Label>
          <Textarea 
            id="qualifications" 
            placeholder="Describe your company's relevant experience and qualifications" 
            required 
            className="mt-1.5"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="documents">Supporting Documents (Optional)</Label>
          <Input 
            id="documents" 
            type="file" 
            className="mt-1.5" 
            multiple
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload additional documents to support your bid. 
            All files will be encrypted and securely stored on IPFS.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox id="termsAndConditions" required />
          <Label htmlFor="termsAndConditions" className="text-sm">
            I certify that all information provided is accurate and legally binding
          </Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => navigate(`/tenders/${tenderId}`)}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-blockchain-blue hover:bg-blockchain-purple" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Bid...
            </>
          ) : (
            "Submit Bid"
          )}
        </Button>
      </div>
    </form>
  );
};

export default BidForm;
