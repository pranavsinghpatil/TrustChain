import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload } from "lucide-react";

interface BidFormProps {
  tenderId: number;
}

const BidForm = ({ tenderId }: BidFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitBid, connectWallet, isConnected } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [proposedTimeline, setProposedTimeline] = useState("");
  const [technicalProposal, setTechnicalProposal] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!isConnected) {
        await connectWallet();
      }
      
      // Prepare bid description by combining technical proposal and qualifications
      const description = `Technical Proposal: ${technicalProposal}\n\nQualifications: ${qualifications}\n\nProposed Timeline: ${proposedTimeline} days`;
      
      // Convert bid amount to appropriate format (ETH)
      const amount = bidAmount;
      
      // Submit bid to blockchain
      const success = await submitBid(tenderId, amount, description);
      
      if (success) {
        toast({
          title: "Bid Submitted!",
          description: "Your bid has been successfully recorded on the blockchain",
        });
        
        navigate(`/tender/${tenderId}`);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bidAmount" className="text-white">Bid Amount (ETH)</Label>
          <Input 
            id="bidAmount" 
            type="number" 
            placeholder="Enter your bid amount" 
            required 
            className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
            min="0.01"
            step="0.01"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="proposedTimeline" className="text-white">Proposed Timeline (Days)</Label>
          <Input 
            id="proposedTimeline" 
            type="number" 
            placeholder="Number of days to complete" 
            required 
            className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
            min="1"
            value={proposedTimeline}
            onChange={(e) => setProposedTimeline(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="technicalProposal" className="text-white">Technical Proposal</Label>
          <Textarea 
            id="technicalProposal" 
            placeholder="Describe your technical approach to fulfilling the tender requirements" 
            required 
            className="mt-1.5 min-h-[120px] bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
            value={technicalProposal}
            onChange={(e) => setTechnicalProposal(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="qualifications" className="text-white">Company Qualifications</Label>
          <Textarea 
            id="qualifications" 
            placeholder="Describe your company's experience and qualifications" 
            required 
            className="mt-1.5 min-h-[120px] bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="documents" className="text-white block mb-2">Supporting Documents (Optional)</Label>
          <div className="border-2 border-dashed border-green-800/30 rounded-lg p-6 text-center bg-gray-800/20">
            <Input
              id="documents"
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="documents"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="h-10 w-10 text-[rgba(80,252,149,0.8)] mb-2" />
              <p className="text-white mb-1">Drag and drop files here, or click to browse</p>
              <p className="text-sm text-gray-400">
                PDF, DOCX, XLSX up to 10MB each
              </p>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            In a production environment, these files would be uploaded to IPFS and linked to your bid on the blockchain.
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="bg-gray-800/30 rounded-lg p-4 border border-green-800/30">
            <h4 className="font-medium text-white mb-2">Selected Files</h4>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                >
                  <div className="flex items-center">
                    <span className="text-white">{file.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                  >
                    <span className="sr-only">Remove</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox id="termsAndConditions" required />
          <Label htmlFor="termsAndConditions" className="text-sm text-white">
            I certify that all information provided is accurate and legally binding
          </Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => navigate(`/tender/${tenderId}`)}
          className="border-green-800/50 text-white hover:bg-gray-800/50"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black" 
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
