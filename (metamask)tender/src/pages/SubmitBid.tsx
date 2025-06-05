import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NavBar from "@/components/layout/NavBar";
import BidForm from "@/components/bid/BidForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Lock, Loader2 } from "lucide-react";
import { useWeb3, Tender } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";

const SubmitBid = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTenderById, connectWallet, isConnected } = useWeb3();
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenderId, setTenderId] = useState<number | null>(null);

  useEffect(() => {
    const loadTenderData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        if (!isConnected) await connectWallet();
        
        // Convert id to number since fetchTenderById expects a number
        const numericId = parseInt(id);
        setTenderId(numericId);
        
        const tenderData = await fetchTenderById(numericId);
        setTender(tenderData);
        
        // Check if tender is still open for bidding
        if (tenderData && tenderData.status !== 'open') {
          setError(`This tender is ${tenderData.status} and no longer accepting bids.`);
        }
        
        // Check if deadline has passed
        const now = Math.floor(Date.now() / 1000);
        if (tenderData && now > tenderData.deadline) {
          setError("The deadline for this tender has passed.");
        }
        
      } catch (error) {
        console.error("Error loading tender details:", error);
        setError("Failed to load tender details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadTenderData();
  }, [id, isConnected, connectWallet, fetchTenderById]);

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

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container pt-20 pb-20">
        <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden p-6">
          <div className="my-8">
            <h1 className="text-2xl font-bold text-white mb-4">Submit Bid</h1>
            <p className="text-gray-400 mt-1">
              For Tender: {tender.title} (ID: {tender.id})
            </p>
          </div>
          
          {error ? (
            <Alert className="mb-6 bg-red-900/30 border-red-500 text-white">
              <Info className="h-4 w-4 text-red-400" />
              <AlertTitle>Unable to Submit Bid</AlertTitle>
              <AlertDescription className="text-gray-300">
                {error}
              </AlertDescription>
              <div className="mt-4">
                <Button onClick={() => navigate(`/tender/${tenderId}`)} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Tender Details
                </Button>
              </div>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                  <CardHeader className="border-b border-green-800/30">
                    <CardTitle className="text-[rgba(80,252,149,0.8)]">Bid Submission Form</CardTitle>
                    <CardDescription className="text-gray-400">
                      Submit your proposal for this tender
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {tenderId !== null && <BidForm tenderId={tenderId} />}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                  <CardHeader className="border-b border-green-800/30">
                    <CardTitle className="text-[rgba(80,252,149,0.8)]">Tender Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <p className="text-sm text-gray-400">Title</p>
                      <p className="font-medium text-white">{tender.title}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Department</p>
                      <p className="text-white">{tender.department}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Budget</p>
                      <p className="text-white">{tender.budget} ETH</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Deadline</p>
                      <p className="text-white">{new Date(tender.deadline * 1000).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Time Remaining</p>
                      <p className="text-white">
                        {Math.max(0, Math.floor((tender.deadline - (Date.now() / 1000)) / (60 * 60 * 24)))} days
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/40 backdrop-blur-md border-green-800">
                  <CardHeader className="border-b border-green-800/30">
                    <CardTitle className="flex items-center text-[rgba(80,252,149,0.8)]">
                      <Lock className="h-4 w-4 mr-2" />
                      Bid Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-300 mb-4">
                      All bids are secured using blockchain technology:
                    </p>
                    
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <span className="text-[rgba(80,252,149,0.8)] mr-2">•</span>
                        <span className="text-gray-300">Your bid is permanently recorded on the blockchain with a timestamp.</span>
                      </li>
                      
                      <li className="flex items-start">
                        <span className="text-[rgba(80,252,149,0.8)] mr-2">•</span>
                        <span className="text-gray-300">All bid details are transparent and cannot be altered after submission.</span>
                      </li>
                      
                      <li className="flex items-start">
                        <span className="text-[rgba(80,252,149,0.8)] mr-2">•</span>
                        <span className="text-gray-300">Every bid submission receives a transaction hash as proof of submission.</span>
                      </li>
                      
                      <li className="flex items-start">
                        <span className="text-[rgba(80,252,149,0.8)] mr-2">•</span>
                        <span className="text-gray-300">The smart contract automatically rejects late submissions based on the blockchain timestamp.</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubmitBid;
