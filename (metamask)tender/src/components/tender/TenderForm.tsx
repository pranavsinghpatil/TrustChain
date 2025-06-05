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
  const [startDate, setStartDate] = useState<Date | undefined>(new Date()); // Default to now
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default to 7 days from now
    return date;
  });
  const [criteria, setCriteria] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

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
    
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    if (startDate >= endDate) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!isConnected) {
        await connectWallet();
      }
      
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
        startDate: startDate.getTime(),
        deadline: endDate.getTime(),
        criteria: criteriaArray,
        documents,
        category,
        location
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-white">Department</Label>
                <Select 
                  value={department} 
                  onValueChange={setDepartment}
                  required
                >
                  <SelectTrigger className="w-full bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-green-800/30">
                    <SelectItem value="public_works">Public Works</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="urban_development">Urban Development</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="information_technology">Information Technology</SelectItem>
                    <SelectItem value="tourism">Tourism</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="defense">Defense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select 
                  value={category} 
                  onValueChange={setCategory}
                >
                  <SelectTrigger className="w-full bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-green-800/30">
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="it_services">IT Services</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-white">Location</Label>
              <Select 
                value={location} 
                onValueChange={setLocation}
              >
                <SelectTrigger className="w-full bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-green-800/30">
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="bengaluru">Bengaluru</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="kolkata">Kolkata</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                  <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                  <SelectItem value="jaipur">Jaipur</SelectItem>
                  <SelectItem value="lucknow">Lucknow</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="multiple">Multiple Locations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          // If end date is before the new start date, update it too
                          if (endDate && date > endDate) {
                            const newEndDate = new Date(date);
                            newEndDate.setDate(date.getDate() + 1);
                            setEndDate(newEndDate);
                          }
                        }
                      }}
                      fromDate={new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      fromDate={startDate ? new Date(startDate.getTime() + 86400000) : new Date()}
                      initialFocus
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
