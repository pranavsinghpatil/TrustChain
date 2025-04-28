
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TenderForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Success!",
        description: "Tender has been created and added to the blockchain",
      });
      navigate("/tenders");
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Tender Title</Label>
          <Input 
            id="title" 
            placeholder="Enter the title of your tender" 
            required 
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="department">Department</Label>
          <Select required>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="it">Information Technology</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input 
              id="budget" 
              type="number" 
              placeholder="Enter budget amount" 
              required 
              className="mt-1.5"
              min="1000"
            />
          </div>
          
          <div>
            <Label>Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full mt-1.5 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select deadline</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Describe the tender requirements in detail" 
            required 
            className="mt-1.5"
            rows={5}
          />
        </div>
        
        <div>
          <Label htmlFor="criteria">Selection Criteria</Label>
          <Textarea 
            id="criteria" 
            placeholder="Specify the criteria that will be used for bid selection" 
            required 
            className="mt-1.5"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="documents">Documents (Optional)</Label>
          <Input 
            id="documents" 
            type="file" 
            className="mt-1.5" 
            multiple
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload specifications, blueprints, or any other relevant files. 
            All files will be cryptographically secured on IPFS.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => navigate("/")}
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
              Creating Tender...
            </>
          ) : (
            "Create Tender"
          )}
        </Button>
      </div>
    </form>
  );
};

export default TenderForm;
