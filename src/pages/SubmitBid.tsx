import { useParams } from "react-router-dom";
import NavBar from "@/components/layout/NavBar";
import BidForm from "@/components/bid/BidForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Lock } from "lucide-react";

const SubmitBid = () => {
  const { id } = useParams<{ id: string }>();
  
  // Mock data for demo purposes
  const tender = {
    id: id || 'T-2025-001',
    title: 'Hospital Management System',
    department: 'Healthcare',
    budget: '$250,000',
    deadline: '2025-05-15',
  };

  return (
    <div className="min-h-screen bg-gray-50/0">
      <NavBar />
      
      <main className="container pt-20 pb-10">
        <div className="my-8">
          <h1 className="text-3xl font-bold">Submit Bid</h1>
          <p className="text-gray-600 mt-1">
            For Tender: {tender.title} (ID: {tender.id})
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Alert className="mb-6 border-blockchain-blue bg-blue-50">
              <Info className="h-4 w-4 text-blockchain-blue" />
              <AlertTitle>Important Information</AlertTitle>
              <AlertDescription>
                Your bid will be encrypted and sealed on the blockchain until the tender deadline. 
                No one—including the tender issuer—can view the bid details until the submission period ends.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Bid Details</CardTitle>
                <CardDescription>
                  Submit your proposal for tender {tender.id}. Be sure to provide all required information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BidForm tenderId={tender.id} />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tender Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium">{tender.title}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p>{tender.department}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p>{tender.budget}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p>{tender.deadline}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Bid Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  All bids are secured using advanced blockchain encryption:
                </p>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="text-blockchain-purple mr-2">•</span>
                    <span>Your bid is encrypted with a unique key that is only revealed after the submission deadline.</span>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-blockchain-purple mr-2">•</span>
                    <span>Bid amounts and details remain completely hidden from all parties until the official opening time.</span>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-blockchain-purple mr-2">•</span>
                    <span>Every bid submission receives a blockchain receipt as proof of submission time and content integrity.</span>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="text-blockchain-purple mr-2">•</span>
                    <span>The smart contract automatically rejects late submissions based on the blockchain timestamp.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitBid;
