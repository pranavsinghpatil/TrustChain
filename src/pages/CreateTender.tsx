import NavBar from "@/components/layout/NavBar";
import TenderForm from "@/components/tender/TenderForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CreateTender = () => {
  return (
    <div className="min-h-screen bg-gray-50/0">
      <NavBar />
      
      <main className="container pt-20 pb-10">
        <div className="my-8">
          <h1 className="text-3xl font-bold">Create New Tender</h1>
          <p className="text-gray-600 mt-1">
            Publish a new tender to the blockchain
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tender Information</CardTitle>
                <CardDescription>
                  Fill in the details for your tender. All information will be stored securely on the blockchain.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TenderForm />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-4">
                  <li className="text-sm">
                    <span className="font-medium">Create Tender</span>
                    <p className="text-gray-600">Fill in all required details and upload tender documents.</p>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium">Blockchain Recording</span>
                    <p className="text-gray-600">Your tender details are cryptographically secured and published to the blockchain.</p>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium">Vendor Bidding</span>
                    <p className="text-gray-600">Vendors submit encrypted bids that remain sealed until the deadline.</p>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium">Smart Selection</span>
                    <p className="text-gray-600">After the deadline, the system automatically evaluates bids based on your criteria.</p>
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
                    <div className="mr-3 h-8 w-8 rounded-full bg-blockchain-lightPurple flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <span className="text-sm">Encrypted bid submission</span>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-blockchain-lightPurple flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <span className="text-sm">Tamper-proof records</span>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-blockchain-lightPurple flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm">Time-locked bid opening</span>
                  </li>
                  
                  <li className="flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-blockchain-lightPurple flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E59A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                    <span className="text-sm">Complete audit transparency</span>
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
