import NavBar from "@/components/layout/NavBar";
import StatCard from "@/components/dashboard/StatCard";
import TenderStatusChart from "@/components/dashboard/TenderStatusChart";
import RecentTendersTable from "@/components/dashboard/RecentTendersTable";
import BlockchainVisualizer from "@/components/blockchain/BlockchainVisualizer";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Users, AlertTriangle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  // Mock data for demo purposes
  const chartData = [
    { name: 'Open', value: 12, color: '#10B981' },
    { name: 'Closed', value: 8, color: '#8E9196' },
    { name: 'Awarded', value: 6, color: '#8B5CF6' },
    { name: 'Disputed', value: 2, color: '#EF4444' },
  ];
  
  const recentTenders = [
    { 
      id: 'T-2025-001', 
      title: 'Hospital Management System', 
      department: 'Healthcare', 
      budget: '$250,000', 
      deadline: '2025-05-15', 
      status: 'open' as const
    },
    { 
      id: 'T-2025-002', 
      title: 'Smart Traffic Control System', 
      department: 'Infrastructure', 
      budget: '$500,000', 
      deadline: '2025-05-05', 
      status: 'open' as const
    },
    { 
      id: 'T-2025-003', 
      title: 'E-Learning Platform', 
      department: 'Education', 
      budget: '$175,000', 
      deadline: '2025-04-28', 
      status: 'closed' as const
    },
    { 
      id: 'T-2025-004', 
      title: 'City Waste Management', 
      department: 'Municipal', 
      budget: '$380,000', 
      deadline: '2025-04-20', 
      status: 'awarded' as const
    },
  ];
  
  const blockchainBlocks = [
    {
      id: 5,
      hash: '0x6a95f3e8770e2cc32f8df65f35dcacf2bd3d8b87c5c29ea8a3c39006b782a3fd',
      previousHash: '0x3a42e8d7f9e9c9b43d5e24a3136f5d6a9e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      timestamp: Date.now() - 1000 * 60 * 5,
      data: {
        type: 'bid',
        title: 'Bid for Hospital System',
        action: 'Vendor ABC submitted a bid'
      }
    },
    {
      id: 4,
      hash: '0x3a42e8d7f9e9c9b43d5e24a3136f5d6a9e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      previousHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
      timestamp: Date.now() - 1000 * 60 * 30,
      data: {
        type: 'tender',
        title: 'Hospital Management System',
        action: 'New tender created'
      }
    },
    {
      id: 3,
      hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
      previousHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
      data: {
        type: 'award',
        title: 'City Park Renovation',
        action: 'Tender awarded to vendor XYZ'
      }
    },
    {
      id: 2,
      hash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
      previousHash: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1',
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
      data: {
        type: 'dispute',
        title: 'School Renovation Project',
        action: 'Dispute raised by vendor ABC'
      }
    },
    {
      id: 1,
      hash: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1',
      previousHash: '',
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      data: {
        type: 'tender',
        title: 'School Renovation Project',
        action: 'New tender created'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/0">
      <NavBar />
      
      <main className="container pt-20 pb-10">
        <div className="flex justify-between items-center my-8">
          <div>
            <h1 className="text-3xl font-bold">Tender Management Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Secure, transparent, and efficient tender process powered by blockchain
            </p>
          </div>
          
          <Button asChild className="bg-blockchain-blue hover:bg-blockchain-purple">
            <Link to="/create-tender" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New Tender
            </Link>
          </Button>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Active Tenders" 
            value="28" 
            icon={<FileText className="h-5 w-5 text-blockchain-purple" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard 
            title="Total Value" 
            value="$3.8M" 
            icon={<TrendingUp className="h-5 w-5 text-blockchain-blue" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard 
            title="Registered Vendors" 
            value="96" 
            icon={<Users className="h-5 w-5 text-blockchain-blue" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard 
            title="Disputes" 
            value="2" 
            icon={<AlertTriangle className="h-5 w-5 text-blockchain-red" />}
            trend={{ value: 1, isPositive: false }}
          />
        </div>
        
        {/* Charts & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <TenderStatusChart data={chartData} />
          </div>
          <div className="lg:col-span-2">
            <BlockchainVisualizer blocks={blockchainBlocks} />
          </div>
        </div>
        
        {/* Recent Tenders Table */}
        <div className="mb-8">
          <RecentTendersTable tenders={recentTenders} />
        </div>
      </main>
    </div>
  );
};

export default Index;
