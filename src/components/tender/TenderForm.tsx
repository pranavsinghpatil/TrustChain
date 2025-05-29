import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TenderForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createNewTender, connectWallet, isConnected } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [criteria, setCriteria] = useState("");
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
    
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a deadline date",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!isConnected) {
        await connectWallet();
      }
      
      // Convert deadline to Unix timestamp (seconds)
      const deadlineTimestamp = Math.floor(date.getTime() / 1000);
      
      // Format criteria as an array
      const criteriaArray = criteria
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
      
      // Format documents if any
      const documents = files.map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        // In a real implementation, we would upload files to IPFS here
        // and include the IPFS hash/URL
      }));
      
      // Create the tender on the blockchain
      const tenderId = await createNewTender({
        title,
        description,
        department,
        budget,
        deadline: deadlineTimestamp,
        criteria: criteriaArray,
        documents
      });
      
      toast({
        title: "Tender Created",
        description: `Your tender has been successfully created with ID: ${tenderId}`,
      });
      
      navigate("/tenders");
    } catch (error) {
      console.error("Error creating tender:", error);
      toast({
        title: "Error",
        description: "Failed to create tender. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-green-800">
        <h3 className="text-lg font-medium text-[rgba(80,252,149,0.8)]">Create New Tender</h3>
        <p className="text-sm text-gray-400 mt-1">Fill in the details to create a new blockchain-secured tender</p>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Tender Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter the title of your tender" 
                required 
                className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
              />
            </div>
            
            <div>
              <Label htmlFor="department" className="text-white">Department</Label>
              <Select 
                value={department}
                onValueChange={val => setDepartment(val)}
              >
                <SelectTrigger className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-green-800/30">
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget" className="text-white">Budget (₹)</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="Enter budget amount" 
                  required 
                  className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
                  min="1000"
                />
              </div>
              
              <div>
                <Label className="text-white">Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full mt-1.5 justify-start text-left font-normal bg-gray-800/50 border-green-800/30 text-white hover:bg-gray-700/50 hover:border-[rgba(80,252,149,0.5)]",
                        !date && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select deadline</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-green-800/30">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="bg-gray-800 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the tender requirements in detail" 
                required 
                className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
                rows={5}
              />
            </div>
            
            <div>
              <Label htmlFor="criteria" className="text-white">Selection Criteria</Label>
              <Textarea 
                id="criteria"
                value={criteria}
                onChange={e => setCriteria(e.target.value)}
                placeholder="Enter each criterion on a new line" 
                required 
                className="mt-1.5 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter each evaluation criterion on a new line.
              </p>
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
            </div>
            
            {files.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-green-800/30">
                <h4 className="font-medium text-white mb-2">Uploaded Files</h4>
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
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t border-green-800/30">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/tenders")}
              className="border-green-800 text-[rgba(80,252,149,0.8)] hover:text-black hover:bg-[rgba(80,252,149,0.8)] transition-colors"
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
                  Creating Tender...
                </>
              ) : (
                "Create Tender"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenderForm;
