
import NavBar from "@/components/layout/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock, DollarSign, File, Percent } from "lucide-react";

const MyBids = () => {
  // Mock data for demo purposes
  const activeBids = [
    {
      id: 'BID-2025-001',
      tenderId: 'T-2025-001',
      tenderTitle: 'Hospital Management System',
      bidAmount: '$235,000',
      bidDate: '2025-04-08',
      status: 'pending',
      deadline: '2025-05-15',
      department: 'Healthcare',
      winProbability: 76
    },
    {
      id: 'BID-2025-002',
      tenderId: 'T-2025-002',
      tenderTitle: 'Smart Traffic Control System',
      bidAmount: '$490,000',
      bidDate: '2025-04-12',
      status: 'pending',
      deadline: '2025-05-05',
      department: 'Infrastructure',
      winProbability: 62
    },
  ];
  
  const completedBids = [
    {
      id: 'BID-2024-015',
      tenderId: 'T-2024-042',
      tenderTitle: 'City Park Renovation',
      bidAmount: '$315,000',
      bidDate: '2024-12-10',
      status: 'won',
      awardDate: '2025-01-05',
      department: 'Parks & Recreation'
    },
    {
      id: 'BID-2024-014',
      tenderId: 'T-2024-039',
      tenderTitle: 'Municipal Website Redesign',
      bidAmount: '$95,000',
      bidDate: '2024-11-22',
      status: 'lost',
      awardDate: '2024-12-15',
      department: 'IT'
    },
    {
      id: 'BID-2024-013',
      tenderId: 'T-2024-035',
      tenderTitle: 'Public Library Books Supply',
      bidAmount: '$125,000',
      bidDate: '2024-11-05',
      status: 'won',
      awardDate: '2024-11-30',
      department: 'Education'
    },
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blockchain-blue text-white">Under Evaluation</Badge>;
      case 'won':
        return <Badge className="bg-blockchain-green text-white">Won</Badge>;
      case 'lost':
        return <Badge className="bg-blockchain-gray text-white">Lost</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="container pt-20 pb-10">
        <div className="my-8">
          <h1 className="text-3xl font-bold">My Bids</h1>
          <p className="text-gray-600 mt-1">
            Track all your tender bids in one place
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeBids.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Won Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blockchain-green">
                {completedBids.filter(bid => bid.status === 'won').length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {Math.round((completedBids.filter(bid => bid.status === 'won').length / completedBids.length) * 100)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$440K</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="active" className="mb-8">
          <TabsList>
            <TabsTrigger value="active">Active Bids</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            <div className="space-y-6">
              {activeBids.map((bid) => (
                <Card key={bid.id} className="overflow-hidden">
                  <div className="border-l-4 border-blockchain-blue h-full">
                    <div className="p-6">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link to={`/tenders/${bid.tenderId}`} className="hover:underline font-medium">
                              {bid.tenderTitle}
                            </Link>
                            {getStatusBadge(bid.status)}
                          </div>
                          
                          <div className="text-sm text-gray-500 mb-4">
                            {bid.department} • Bid ID: {bid.id} • Tender ID: {bid.tenderId}
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Bid Amount</p>
                                <p className="font-medium">{bid.bidAmount}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <File className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Submitted</p>
                                <p>{bid.bidDate}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Deadline</p>
                                <p>{bid.deadline}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <Percent className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Win Probability</p>
                                <div className="flex items-center">
                                  <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                    <div 
                                      className={`h-full rounded-full ${
                                        bid.winProbability > 70 ? 'bg-blockchain-green' : 'bg-blockchain-blue'
                                      }`} 
                                      style={{ width: `${bid.winProbability}%` }}
                                    ></div>
                                  </div>
                                  <span>{bid.winProbability}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm" asChild className="ml-auto">
                          <Link to={`/tenders/${bid.tenderId}`} className="flex items-center">
                            View Tender
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="space-y-6">
              {completedBids.map((bid) => (
                <Card key={bid.id} className="overflow-hidden">
                  <div className={`border-l-4 ${bid.status === 'won' ? 'border-blockchain-green' : 'border-blockchain-gray'} h-full`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link to={`/tenders/${bid.tenderId}`} className="hover:underline font-medium">
                              {bid.tenderTitle}
                            </Link>
                            {getStatusBadge(bid.status)}
                          </div>
                          
                          <div className="text-sm text-gray-500 mb-4">
                            {bid.department} • Bid ID: {bid.id} • Tender ID: {bid.tenderId}
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Bid Amount</p>
                                <p className="font-medium">{bid.bidAmount}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <File className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Submitted</p>
                                <p>{bid.bidDate}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Award Date</p>
                                <p>{bid.awardDate}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm" asChild className="ml-auto">
                          <Link to={`/tenders/${bid.tenderId}`} className="flex items-center">
                            View Tender
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyBids;
