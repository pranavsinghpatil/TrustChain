import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/layout/NavBar";
import TenderDetailsHeader from "@/components/tender/TenderDetailsHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, Users, Database, CheckCircle, ShieldAlert, Clock } from "lucide-react";

const TenderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contract, connectWallet, isConnected } = useWeb3();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      if (!contract) throw new Error("Connect wallet first");
      if (!isConnected) await connectWallet();
      const tx = await contract.cancelTender(Number(id));
      await tx.wait();
      toast({ title: "Tender Cancelled", description: `Tx ${tx.hash}` });
      navigate("/tenders");
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message });
    } finally {
      setIsCancelling(false);
    }
  };

  // Mock data for demo purposes
  const tender = {
    id: id || 'T-2025-001',
    title: 'Hospital Management System',
    department: 'Healthcare',
    budget: '$250,000',
    deadline: '2025-05-15',
    status: 'open' as const,
    createdAt: '2025-04-05',
    description: 'Design and implementation of a comprehensive hospital management system including patient records, billing, pharmacy, and staff management modules. The system should be HIPAA compliant and integrate with existing healthcare systems.',
    criteria: [
      'Technical expertise in healthcare IT systems',
      'Previous experience with HIPAA compliant systems',
      'Cost-effectiveness',
      'Implementation timeline',
      'Support and maintenance plan'
    ],
    timeline: [
      { date: '2025-04-05', event: 'Tender Published', status: 'completed' },
      { date: '2025-05-15', event: 'Bidding Deadline', status: 'pending' },
      { date: '2025-05-22', event: 'Evaluation Completed', status: 'pending' },
      { date: '2025-05-25', event: 'Winner Announcement', status: 'pending' },
      { date: '2025-06-10', event: 'Contract Signing', status: 'pending' }
    ],
    bidCount: 5,
    documents: [
      { name: 'Technical_Requirements.pdf', size: '2.4 MB' },
      { name: 'Legal_Terms.pdf', size: '1.1 MB' },
      { name: 'System_Architecture.pdf', size: '3.8 MB' }
    ],
    blockchain: [
      {
        date: '2025-04-05 08:30:22',
        action: 'Tender created and published on blockchain',
        hash: '0x3a42e8d7f9e9c9b43d5e24a3136f5d6a9e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5'
      },
      {
        date: '2025-04-06 10:15:40',
        action: 'Vendor ABC submitted a bid',
        hash: '0x6a95f3e8770e2cc32f8df65f35dcacf2bd3d8b87c5c29ea8a3c39006b782a3fd'
      },
      {
        date: '2025-04-10 14:22:05',
        action: 'Vendor XYZ submitted a bid',
        hash: '0x9c87b6a5f4d3c2b1a0e9f8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7'
      },
      {
        date: '2025-04-15 09:05:18',
        action: 'Vendor DEF submitted a bid',
        hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="container pt-20 pb-10">
        <div className="my-8">
          <TenderDetailsHeader 
            id={tender.id} 
            title={tender.title} 
            department={tender.department} 
            budget={tender.budget}
            deadline={tender.deadline}
            status={tender.status}
            createdAt={tender.createdAt}
            documentUrl="#"
          />
          <div className="mt-4 ml-6">
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Tender"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tender Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{tender.description}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Selection Criteria</CardTitle>
                      <CardDescription>Bids will be evaluated based on the following criteria</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-6 space-y-2">
                        {tender.criteria.map((criterion, index) => (
                          <li key={index}>{criterion}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200"></div>
                        <ul className="space-y-6 relative">
                          {tender.timeline.map((event, index) => (
                            <li key={index} className="ml-12 relative">
                              <span className={`absolute -left-12 flex h-6 w-6 items-center justify-center rounded-full ${
                                event.status === 'completed' ? 'bg-blockchain-green text-white' : 'bg-gray-200'
                              }`}>
                                {event.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4 text-gray-500" />
                                )}
                              </span>
                              <div>
                                <div className="font-medium">{event.event}</div>
                                <div className="text-sm text-gray-500">{event.date}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Tender Documents</CardTitle>
                    <CardDescription>All documents are cryptographically secured and stored on IPFS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y">
                      {tender.documents.map((doc, index) => (
                        <li key={index} className="py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-3 text-blockchain-blue" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-gray-500">{doc.size}</p>
                            </div>
                          </div>
                          <Badge variant="outline">View</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="blockchain">
                <Card>
                  <CardHeader>
                    <CardTitle>Blockchain Transactions</CardTitle>
                    <CardDescription>Immutable record of all activities related to this tender</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tender.blockchain.map((item, index) => (
                        <div key={index} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-gray-500">{item.date}</p>
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.hash.substring(0, 6)}...{item.hash.substring(item.hash.length - 6)}
                            </Badge>
                          </div>
                          <p className="text-sm">{item.action}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tender Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-3 text-blockchain-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Published On</p>
                    <p>{tender.createdAt}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-blockchain-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Bids Received</p>
                    <p>{tender.bidCount} bids</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-3 text-blockchain-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Blockchain Status</p>
                    <p>Verified ✓</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-3 text-blockchain-blue" />
                  <div>
                    <p className="text-sm text-gray-500">Security</p>
                    <p>IPFS + Smart Contract</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This tender is secured by blockchain technology, ensuring complete transparency and tamper-proof records of all activities.
                </p>
                <div className="bg-blockchain-lightPurple p-4 rounded-lg">
                  <p className="text-xs font-mono break-all">
                    Contract Address: 0x3a42e8d7f9e9c9b43d5e24a3136f5d6a9e1b2c3d
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenderDetails;
