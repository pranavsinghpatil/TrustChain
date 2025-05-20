import { useState, useEffect } from "react";
import NavBar from "@/components/layout/NavBar";
import { useWeb3, FormattedTender } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import TenderCard from "@/components/tender/TenderCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Tenders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [tendersList, setTendersList] = useState<FormattedTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  
  const { fetchTenders, connectWallet, isConnected, account } = useWeb3();
  const { authState } = useAuth();
  const role = authState.user.role;

  const loadTenders = async () => {
    setLoading(true);
    try {
      if (!isConnected) await connectWallet();
      const tenders = await fetchTenders();
      console.log('Loaded tenders:', tenders);
      if (tenders && Array.isArray(tenders)) {
        setTendersList(tenders);
      } else {
        console.error('Tenders data is not an array:', tenders);
        setTendersList([]);
      }
    } catch (error) {
      console.error("Error loading tenders:", error);
      setTendersList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load tenders when component mounts or when connection status changes
  useEffect(() => {
    loadTenders();
  }, [isConnected]);
  
  // Force reload button
  const handleReload = () => {
    loadTenders();
  };

  const toggleFilter = () => {
    setFilterVisible(!filterVisible);
  };

  // Filter tenders based on search term
  const searchFiltered = tendersList.filter(tender => {
    if (!tender) return false;
    return (
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tender.department && tender.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Apply budget filter
  const budgetFiltered = budgetFilter === "all" 
    ? searchFiltered 
    : searchFiltered.filter(tender => {
        try {
          // Parse budget string to number, removing any non-numeric characters
          const budget = parseFloat(tender.budget.replace(/[^0-9.]/g, ''));
          if (isNaN(budget)) return true; // Include if we can't parse the budget
          
          switch(budgetFilter) {
            case "0-100k": return budget <= 100000;
            case "100k-500k": return budget > 100000 && budget <= 500000;
            case "500k-1m": return budget > 500000 && budget <= 1000000;
            case "1m+": return budget > 1000000;
            default: return true;
          }
        } catch (e) {
          return true; // Include in results if there's an error parsing
        }
      });

  // Apply deadline filter
  const deadlineFiltered = deadlineFilter === "all"
    ? budgetFiltered
    : budgetFiltered.filter(tender => {
        try {
          const now = Math.floor(Date.now() / 1000);
          // Handle both Date objects and timestamps
          let deadlineTimestamp: number;
          
          if (tender.deadline instanceof Date) {
            deadlineTimestamp = Math.floor(tender.deadline.getTime() / 1000);
          } else if (typeof tender.deadline === 'number') {
            deadlineTimestamp = tender.deadline;
          } else {
            return true; // Include if we can't determine the deadline
          }
          
          const diffDays = (deadlineTimestamp - now) / (60 * 60 * 24);
          
          switch(deadlineFilter) {
            case "7days": return diffDays <= 7 && diffDays > 0;
            case "30days": return diffDays <= 30 && diffDays > 0;
            case "90days": return diffDays <= 90 && diffDays > 0;
            default: return true;
          }
        } catch (e) {
          return true; // Include in results if there's an error
        }
      });

  // Convert numeric status to string status for filtering
  const getStatusString = (status: number | string): 'open' | 'closed' | 'awarded' | 'disputed' => {
    if (typeof status === 'string') return status as 'open' | 'closed' | 'awarded' | 'disputed';
    
    // Convert numeric status to string
    switch(status) {
      case 0: return 'open';
      case 1: return 'closed';
      case 2: return 'awarded';
      case 3: return 'disputed';
      default: return 'open';
    }
  };

  // For debugging - log the tenders list
  useEffect(() => {
    if (tendersList.length > 0) {
      console.log('Tenders available for display:', tendersList.length);
    }
  }, [tendersList]);

  // Filter based on user role
  const displayList = (role as string) === 'bidder'
    ? deadlineFiltered.filter(t => getStatusString(t.status) === 'open')
    : (role as string) === 'officer'
      ? deadlineFiltered.filter(t => t.creator && account ? t.creator.toLowerCase() === account.toLowerCase() : false)
      : deadlineFiltered;

  return (
    <div className="min-h-screen">
      {/* <NavBar /> */}
      
      <main className="container pt-20 pb-20">
        <div className="flex justify-between items-center my-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Tenders</h1>
            <p className="text-gray-400 mt-1">
              Browse and bid on available tenders
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Reload button */}
            <Button 
              onClick={handleReload} 
              variant="outline"
              className="border-green-800 text-[rgba(80,252,149,0.8)] hover:text-black hover:bg-[rgba(80,252,149,0.8)]"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Reload Tenders
            </Button>
            
            {/* Only show New Tender button if not on admin or user dashboard */}
            {(role as string) !== 'admin' && (role as string) !== 'user' && (
              <Button asChild className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black">
                <Link to="/create-tender" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  New Tender
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-2/3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search tenders by title or ID..." 
                  className="pl-9 bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={toggleFilter}
              className="border-green-800 text-[rgba(80,252,149,0.8)] hover:text-black hover:bg-[rgba(80,252,149,0.8)] transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {filterVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2 text-white">Budget Range</label>
                <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]">
                    <SelectValue placeholder="Any Budget" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-green-800/30">
                    <SelectItem value="all">Any Budget</SelectItem>
                    <SelectItem value="0-100k">₹0 - ₹1,00,000</SelectItem>
                    <SelectItem value="100k-500k">₹1,00,000 - ₹5,00,000</SelectItem>
                    <SelectItem value="500k-1m">₹5,00,000 - ₹10,00,000</SelectItem>
                    <SelectItem value="1m+">Over ₹10,00,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2 text-white">Deadline</label>
                <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-green-800/30 text-white focus:border-[rgba(80,252,149,0.5)]">
                    <SelectValue placeholder="Any Deadline" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-green-800/30">
                    <SelectItem value="all">Any Deadline</SelectItem>
                    <SelectItem value="7days">Next 7 Days</SelectItem>
                    <SelectItem value="30days">Next 30 Days</SelectItem>
                    <SelectItem value="90days">Next 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-[rgba(80,252,149,0.8)] animate-spin" />
            <span className="ml-3 text-white">Loading tenders from blockchain...</span>
          </div>
        ) : (
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="bg-gray-800/50 border border-green-800/30">
              <TabsTrigger value="all" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">All Tenders</TabsTrigger>
              <TabsTrigger value="open" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Open</TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Closed</TabsTrigger>
              <TabsTrigger value="awarded" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Awarded</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {displayList && displayList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayList.map((tender, index) => {
                    if (!tender) return null;
                    
                    // Format the deadline for display
                    let formattedDeadline: string;
                    try {
                      if (tender.deadline instanceof Date) {
                        formattedDeadline = tender.deadline.toLocaleDateString();
                      } else if (typeof tender.deadline === 'number') {
                        formattedDeadline = new Date(tender.deadline * 1000).toLocaleDateString();
                      } else {
                        formattedDeadline = new Date().toLocaleDateString();
                      }
                    } catch (e) {
                      formattedDeadline = new Date().toLocaleDateString();
                    }
                    
                    // Ensure status is a valid string
                    const statusString = getStatusString(tender.status);
                    
                    return (
                      <TenderCard 
                        key={tender.id || `tender-${index}`} 
                        id={tender.id?.toString() || `tender-${index}`}
                        title={tender.title || `Tender ${index + 1}`}
                        department={tender.department || 'General'}
                        budget={tender.budget || '0'}
                        deadline={formattedDeadline}
                        status={statusString}
                        bidCount={tender.bidCount || 0}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
                  <p className="text-gray-400">No tenders found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="open" className="mt-6">
              {displayList && displayList.filter(t => t && getStatusString(t.status) === 'open').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayList
                    .filter(tender => tender && getStatusString(tender.status) === 'open')
                    .map((tender, index) => {
                      // Format the deadline for display
                      let formattedDeadline: string;
                      try {
                        if (tender.deadline instanceof Date) {
                          formattedDeadline = tender.deadline.toLocaleDateString();
                        } else if (typeof tender.deadline === 'number') {
                          formattedDeadline = new Date(tender.deadline * 1000).toLocaleDateString();
                        } else {
                          formattedDeadline = new Date().toLocaleDateString();
                        }
                      } catch (e) {
                        formattedDeadline = new Date().toLocaleDateString();
                      }
                      
                      return (
                        <TenderCard 
                          key={tender.id || `open-tender-${index}`} 
                          id={tender.id?.toString() || `open-tender-${index}`}
                          title={tender.title || `Open Tender ${index + 1}`}
                          department={tender.department || 'General'}
                          budget={tender.budget || '0'}
                          deadline={formattedDeadline}
                          status={'open'}
                          bidCount={tender.bidCount || 0}
                        />
                      );
                    })
                  }
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
                  <p className="text-gray-400">No open tenders found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="closed" className="mt-6">
              {displayList && displayList.filter(t => t && getStatusString(t.status) === 'closed').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayList
                    .filter(tender => tender && getStatusString(tender.status) === 'closed')
                    .map((tender, index) => {
                      // Format the deadline for display
                      let formattedDeadline: string;
                      try {
                        if (tender.deadline instanceof Date) {
                          formattedDeadline = tender.deadline.toLocaleDateString();
                        } else if (typeof tender.deadline === 'number') {
                          formattedDeadline = new Date(tender.deadline * 1000).toLocaleDateString();
                        } else {
                          formattedDeadline = new Date().toLocaleDateString();
                        }
                      } catch (e) {
                        formattedDeadline = new Date().toLocaleDateString();
                      }
                      
                      return (
                        <TenderCard 
                          key={tender.id || `closed-tender-${index}`} 
                          id={tender.id?.toString() || `closed-tender-${index}`}
                          title={tender.title || `Closed Tender ${index + 1}`}
                          department={tender.department || 'General'}
                          budget={tender.budget || '0'}
                          deadline={formattedDeadline}
                          status={'closed'}
                          bidCount={tender.bidCount || 0}
                        />
                      );
                    })
                  }
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
                  <p className="text-gray-400">No closed tenders found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="awarded" className="mt-6">
              {displayList && displayList.filter(t => t && getStatusString(t.status) === 'awarded').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayList
                    .filter(tender => tender && getStatusString(tender.status) === 'awarded')
                    .map((tender, index) => {
                      // Format the deadline for display
                      let formattedDeadline: string;
                      try {
                        if (tender.deadline instanceof Date) {
                          formattedDeadline = tender.deadline.toLocaleDateString();
                        } else if (typeof tender.deadline === 'number') {
                          formattedDeadline = new Date(tender.deadline * 1000).toLocaleDateString();
                        } else {
                          formattedDeadline = new Date().toLocaleDateString();
                        }
                      } catch (e) {
                        formattedDeadline = new Date().toLocaleDateString();
                      }
                      
                      return (
                        <TenderCard 
                          key={tender.id || `awarded-tender-${index}`} 
                          id={tender.id?.toString() || `awarded-tender-${index}`}
                          title={tender.title || `Awarded Tender ${index + 1}`}
                          department={tender.department || 'General'}
                          budget={tender.budget || '0'}
                          deadline={formattedDeadline}
                          status={'awarded'}
                          bidCount={tender.bidCount || 0}
                        />
                      );
                    })
                  }
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
                  <p className="text-gray-400">No awarded tenders found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Tenders;
