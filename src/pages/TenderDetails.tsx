import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useWeb3, Tender, Bid } from "@/contexts/Web3Context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/layout/NavBar";
import TenderDetailsHeader from "@/components/tender/TenderDetailsHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, Users, Database, CheckCircle, ShieldAlert, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TenderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTenderById, fetchBidsForTender, closeTender, awardTender, disputeTender, connectWallet, isConnected, account, contractAddress, networkName } = useWeb3();
  const { toast } = useToast();
  const { authState } = useAuth();
  const role = authState.user.role;
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBid, setSelectedBid] = useState<string | null>(null);

  const loadTenderData = async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "No tender ID provided in the URL.",
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (!isConnected) await connectWallet();
      const tenderData = await fetchTenderById(id);
      if (!tenderData) {
        toast({
          title: "Tender Not Found",
          description: `No tender found for ID: ${id}.`,
        });
        setTender(null);
      } else {
        setTender(tenderData);
      }
      const bidsData = await fetchBidsForTender(id);
      setBids(bidsData);
    } catch (error) {
      console.error("Error loading tender details:", error);
      toast({
        title: "Error",
        description: "Failed to load tender details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render a message if tender is not found
  if (!loading && !tender) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <NavBar />
        <main className="flex flex-col items-center justify-center flex-1 w-full p-8">
          <div className="bg-gray-900/70 p-8 rounded-lg shadow-lg border border-green-800 text-center">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Tender Not Found</h1>
            <p className="text-gray-300 mb-6">The tender you are looking for does not exist or could not be loaded.</p>
            <Button variant="secondary" onClick={() => navigate('/tenders')}>
              Back to Tenders
            </Button>
          </div>
        </main>
      </div>
    );
  }

  useEffect(() => {
    loadTenderData();
  }, [id, isConnected]);

  const handleCloseTender = async () => {
    if (!tender) return;
    setActionLoading(true);
    
    try {
      if (!isConnected) await connectWallet();
      await closeTender(tender.id);
      toast({ 
        title: "Tender Closed", 
        description: "The tender has been successfully closed." 
      });
      
      // Refresh tender data
      const updatedTender = await fetchTenderById(Number(id));
      setTender(updatedTender);
    } catch (error) {
      console.error("Error closing tender:", error);
      toast({ 
        title: "Error", 
        description: "Failed to close tender. Please try again." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAwardTender = async () => {
    if (!tender || !selectedBid) {
      toast({ 
        title: "Error", 
        description: "Please select a bid to award the tender." 
      });
      return;
    }
    
    setActionLoading(true);
    try {
      if (!isConnected) await connectWallet();
      await awardTender(tender.id, selectedBid);
      toast({ 
        title: "Tender Awarded", 
        description: "The tender has been successfully awarded." 
      });
      
      // Refresh tender data
      const updatedTender = await fetchTenderById(Number(id));
      setTender(updatedTender);
    } catch (error) {
      console.error("Error awarding tender:", error);
      toast({ 
        title: "Error", 
        description: "Failed to award tender. Please try again." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeTender = async () => {
    if (!tender) return;
    setActionLoading(true);
    
    try {
      if (!isConnected) await connectWallet();
      await disputeTender(tender.id);
      toast({ 
        title: "Dispute Filed", 
        description: "A dispute has been filed for this tender." 
      });
      
      // Refresh tender data
      const updatedTender = await fetchTenderById(Number(id));
      setTender(updatedTender);
    } catch (error) {
      console.error("Error filing dispute:", error);
      toast({ 
        title: "Error", 
        description: "Failed to file dispute. Please try again." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate timeline events based on tender data
  const generateTimeline = (tender: any) => {
    const timeline = [];
    
    // Add tender creation event
    const createdDate = tender.createdAt instanceof Date ? 
      tender.createdAt : 
      new Date(typeof tender.createdAt === 'number' ? tender.createdAt * 1000 : Date.now());
    
    timeline.push({
      date: createdDate,
      title: "Tender Created",
      description: `Tender ${tender.id} was created by ${tender.creator ? `${tender.creator.slice(0, 6)}...${tender.creator.slice(-4)}` : 'Unknown'}`
    });
    
    // Add deadline event
    const deadlineDate = tender.deadline instanceof Date ? 
      tender.deadline : 
      new Date(typeof tender.deadline === 'number' ? tender.deadline * 1000 : Date.now() + 86400000);
    
    timeline.push({
      date: deadlineDate,
      title: "Submission Deadline",
      description: `Deadline for submitting bids`
    });
    
    // Add awarded event if tender is awarded
    if (tender.status === 'awarded') {
      timeline.push({
        date: new Date(Date.now() - 86400000), // Mock date 1 day ago
        title: "Tender Awarded",
        description: `Tender was awarded`
      });
    }
    
    // Add closed event if tender is closed
    if (tender.status === 'closed') {
      timeline.push({
        date: new Date(Date.now() - 172800000), // Mock date 2 days ago
        title: "Tender Closed",
        description: `Tender was closed without award`
      });
    }
    
    // Add disputed event if tender is disputed
    if (tender.status === 'disputed') {
      timeline.push({
        date: new Date(Date.now() - 259200000), // Mock date 3 days ago
        title: "Dispute Filed",
        description: `A dispute was filed for this tender`
      });
    }
    
    // Sort timeline by date
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-[rgba(80,252,149,0.8)] animate-spin mb-4" />
          <p className="text-white">Loading tender details from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Tender Not Found</h2>
          <p className="text-gray-400 mb-6">The tender you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/tenders')} className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black">
            Back to Tenders
          </Button>
        </div>
      </div>
    );
  }

  const timeline = generateTimeline(tender);
  const isCreator = account?.toLowerCase() === tender.creator.toLowerCase();
  const canAward = isCreator && tender.status === 'open' && bids.length > 0 && Date.now() / 1000 > tender.deadline;
  const canClose = isCreator && tender.status === 'open';
  const canDispute = tender.status === 'awarded' && !tender.disputed && (role === 'bidder' || role === 'admin');

  return (
    <div className="min-h-screen">
      {/* <NavBar /> */}
      
      <main className="container pt-20 pb-[7.5rem]">
        <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden p-6">
          <div className="my-8">
            <TenderDetailsHeader 
              id={tender.id || ''}
              title={tender.title || ''}
              department={tender.department || 'General Department'}
              budget={typeof tender.budget === 'string' ? tender.budget : '0'}
              deadline={tender.deadline instanceof Date ? 
                tender.deadline.toLocaleDateString() : 
                new Date(typeof tender.deadline === 'number' ? tender.deadline * 1000 : Date.now()).toLocaleDateString()}
              status={typeof tender.status === 'string' ? 
                tender.status as 'open' | 'closed' | 'awarded' | 'disputed' : 'open'}
              createdAt={tender.createdAt instanceof Date ? 
                tender.createdAt.toLocaleDateString() : 
                new Date(typeof tender.createdAt === 'number' ? tender.createdAt * 1000 : Date.now()).toLocaleDateString()}
              bidCount={tender.bidCount || 0}
            />
            
            <div className="flex justify-end gap-4 mt-6">
              {canAward && (
                <Button 
                  onClick={handleAwardTender} 
                  disabled={actionLoading || !selectedBid}
                  className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Award Tender
                </Button>
              )}
              
              {canClose && (
                <Button 
                  onClick={handleCloseTender} 
                  disabled={actionLoading}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                  Close Tender
                </Button>
              )}
              
              {canDispute && (
                <Button 
                  onClick={handleDisputeTender} 
                  disabled={actionLoading}
                  variant="outline"
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
                  File Dispute
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="details">
                <TabsList className="bg-gray-800/50 border border-green-800/30">
                  <TabsTrigger value="details" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Details</TabsTrigger>
                  <TabsTrigger value="bids" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Bids</TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Timeline</TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-[rgba(80,252,149,0.2)] data-[state=active]:text-[rgba(80,252,149,0.8)]">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                    <CardHeader className="border-b border-green-800/30">
                      <CardTitle className="text-[rgba(80,252,149,0.8)]">Tender Description</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-gray-300 mb-6">{tender.description}</p>
                      
                      <h4 className="font-semibold text-white mb-3">Evaluation Criteria</h4>
                      <ul className="list-disc pl-5 space-y-2 text-gray-300">
                        {tender.criteria && tender.criteria.length > 0 ? (
                          tender.criteria.map((criterion, index) => (
                            <li key={index}>{criterion}</li>
                          ))
                        ) : (
                          <li>No evaluation criteria specified for this tender.</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="bids">
                  <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                    <CardHeader className="border-b border-green-800/30">
                      <CardTitle className="text-[rgba(80,252,149,0.8)]">Submitted Bids</CardTitle>
                      <CardDescription className="text-gray-400">
                        {bids && bids.length > 0 ? `${bids.length} ${bids.length === 1 ? 'bid' : 'bids'} received for this tender` : 'No bids received yet'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {bids && bids.length > 0 ? (
                        <div className="space-y-4">
                          {bids.map((bid) => (
                            <div 
                              key={bid.bidder} 
                              className={`border rounded-lg p-4 transition-colors ${
                                selectedBid === bid.bidder 
                                  ? 'border-[rgba(80,252,149,0.8)] bg-[rgba(80,252,149,0.1)]' 
                                  : 'border-green-800/30 hover:border-[rgba(80,252,149,0.5)]'
                              } ${canAward ? 'cursor-pointer' : ''}`}
                              onClick={() => canAward && setSelectedBid(bid.bidder)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-white">{bid.bidder.substring(0, 6)}...{bid.bidder.substring(bid.bidder.length - 4)}</p>
                                  <p className="text-sm text-gray-400">Bid Amount: {bid.amount} ETH</p>
                                </div>
                                <Badge variant={tender.winner === bid.bidder ? "default" : "outline"} className={tender.winner === bid.bidder ? "bg-[rgba(80,252,149,0.8)] text-black" : "border-green-800/50 text-gray-300"}>
                                  {tender.winner === bid.bidder ? "Winner" : "Pending"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-300 mt-2">{bid.description}</p>
                              <div className="mt-3 text-xs text-gray-400">
                                Submitted on {new Date(bid.timestamp * 1000).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No bids have been submitted for this tender yet.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="timeline">
                  <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                    <CardHeader className="border-b border-green-800/30">
                      <CardTitle className="text-[rgba(80,252,149,0.8)]">Tender Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-800/30"></div>
                        <div className="space-y-8">
                          {timeline.map((item, index) => (
                            <div key={index} className="relative pl-10">
                              <div className={`absolute left-0 top-1.5 h-8 w-8 rounded-full flex items-center justify-center ${
                                item.status === 'completed' 
                                  ? 'bg-[rgba(80,252,149,0.2)] text-[rgba(80,252,149,0.8)]' 
                                  : 'bg-gray-800/50 text-gray-400'
                              }`}>
                                {item.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                              </div>
                              <p className="font-medium text-white">{item.event}</p>
                              <p className="text-sm text-gray-400 mt-1">{item.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="documents">
                  <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                    <CardHeader className="border-b border-green-800/30">
                      <CardTitle className="text-[rgba(80,252,149,0.8)]">Tender Documents</CardTitle>
                      <CardDescription className="text-gray-400">
                        Supporting documents and specifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {tender.documents && tender.documents.length > 0 ? (
                        <ul className="space-y-3">
                          {tender.documents.map((doc, index) => (
                            <li key={index} className="flex items-center justify-between p-3 border border-green-800/30 rounded-lg">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-3 text-[rgba(80,252,149,0.8)]" />
                                <span className="text-white">{doc.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-400 mr-3">{doc.size}</span>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[rgba(80,252,149,0.8)]">
                                  <span className="sr-only">Download</span>
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
                                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No documents have been uploaded for this tender.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                <CardHeader className="border-b border-green-800/30">
                  <CardTitle className="text-[rgba(80,252,149,0.8)]">Tender Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 mr-3 text-[rgba(80,252,149,0.8)]" />
                    <div>
                      <p className="text-sm text-gray-400">Published On</p>
                      <p className="text-white">{new Date(tender.createdAt * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-[rgba(80,252,149,0.8)]" />
                    <div>
                      <p className="text-sm text-gray-400">Bids Received</p>
                      <p className="text-white">{tender.bidCount} bids</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Database className="h-5 w-5 mr-3 text-[rgba(80,252,149,0.8)]" />
                    <div>
                      <p className="text-sm text-gray-400">Blockchain Status</p>
                      <p className="text-white">Verified ✓</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-3 text-[rgba(80,252,149,0.8)]" />
                    <div>
                      <p className="text-sm text-gray-400">Security</p>
                      <p className="text-white">IPFS + Smart Contract</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                <CardHeader className="border-b border-green-800/30">
                  <CardTitle className="text-[rgba(80,252,149,0.8)]">Transparency</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-300 mb-4">
                    This tender is secured by blockchain technology, ensuring complete transparency and tamper-proof records of all activities.
                  </p>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-green-800/30">
                    <p className="text-xs font-mono break-all text-gray-300">
                      Network: {networkName}
                    </p>
                    <p className="text-xs font-mono break-all text-gray-300 mt-2">
                      Contract Address: {contractAddress}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenderDetails;
