import NavBar from "@/components/layout/NavBar";
import TenderForm from "@/components/tender/TenderForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Lock, Eye } from "lucide-react";

const CreateTender = () => {
  return (
    <div className="min-h-screen bg-gray-50/0">
      {/* <NavBar /> */}
      
      <main className="container pt-20 pb-20">
        <div className="my-8">
          <h1 className="text-3xl font-bold text-white">Create New Tender</h1>
          <p className="text-gray-400 mt-1">
            Publish a new tender to the blockchain
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TenderForm />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-4">
                  <li className="text-sm">
                    <span className="font-medium text-white">Create Tender</span>
                    <p className="text-gray-400">Fill in all required details and upload tender documents.</p>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium text-white">Blockchain Recording</span>
                    <p className="text-gray-400">Your tender details are cryptographically secured and published to the blockchain.</p>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium text-white">Vendor Bidding</span>
                    <p className="text-gray-400">Vendors submit encrypted bids that remain sealed until the deadline.</p>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium text-white">Smart Selection</span>
                    <p className="text-gray-400">After the deadline, the system automatically evaluates bids based on your criteria.</p>
                  </li>
                </ol>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-[rgba(80,252,149,0.1)] border border-[rgba(80,252,149,0.2)] flex items-center justify-center">
                      <Lock className="h-4 w-4 text-[rgba(80,252,149,0.8)]" />
                    </div>
                    <span className="text-sm text-gray-300">Encrypted bid submission</span>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-[rgba(80,252,149,0.1)] border border-[rgba(80,252,149,0.2)] flex items-center justify-center">
                      <Shield className="h-4 w-4 text-[rgba(80,252,149,0.8)]" />
                    </div>
                    <span className="text-sm text-gray-300">Tamper-proof records</span>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-[rgba(80,252,149,0.1)] border border-[rgba(80,252,149,0.2)] flex items-center justify-center">
                      <Clock className="h-4 w-4 text-[rgba(80,252,149,0.8)]" />
                    </div>
                    <span className="text-sm text-gray-300">Time-locked bid opening</span>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-[rgba(80,252,149,0.1)] border border-[rgba(80,252,149,0.2)] flex items-center justify-center">
                      <Eye className="h-4 w-4 text-[rgba(80,252,149,0.8)]" />
                    </div>
                    <span className="text-sm text-gray-300">Transparent evaluation</span>
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

export default CreateTender;
