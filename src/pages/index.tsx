import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Plus, ChevronRight, FileText, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import TrueFocus from "@/components/blockchain/true";
import ClipPathImage from "@/components/ui/ClipPathImage";
import NavBar from "@/components/layout/NavBar";
import StatCard from "@/components/dashboard/StatCard";
import TenderStatusChart from "@/components/dashboard/TenderStatusChart";
import RecentTendersTable from "@/components/dashboard/RecentTendersTable";
import BlockchainVisualizer from "@/components/blockchain/BlockchainVisualizer";
import { useWeb3 } from "@/contexts/Web3Context";
import type { Tender } from "@/contexts/Web3Context";

const Index = () => {
  const [showHero, setShowHero] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showTenders, setShowTenders] = useState(false);
  const [fadeInClass] = useState('transition-all duration-1000 ease-out');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchTenders, isConnected, connectWallet } = useWeb3();

  useEffect(() => {
    setShowHero(true);
  }, []);

  useEffect(() => {
    const loadTenderData = async () => {
      try {
        if (!isConnected) {
          await connectWallet();
        }
        
        const allTenders = await fetchTenders();
        setTenders(allTenders);
        
        // Generate chart data from real tenders
        const statusCounts = {
          open: 0,
          closed: 0,
          awarded: 0,
          disputed: 0
        };
        
        allTenders.forEach(tender => {
          statusCounts[tender.status]++;
        });
        
        setChartData([
          { name: 'Open', value: statusCounts.open, color: '#10B981' },
          { name: 'Closed', value: statusCounts.closed, color: '#8E9196' },
          { name: 'Awarded', value: statusCounts.awarded, color: '#8B5CF6' },
          { name: 'Disputed', value: statusCounts.disputed, color: '#EF4444' },
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading tender data:", error);
        setLoading(false);
      }
    };
    
    loadTenderData();
  }, [fetchTenders, isConnected, connectWallet]);

  // Map tenders to the format expected by RecentTendersTable
  const recentTenders = tenders
    .slice(0, 5) // Get only the 5 most recent tenders
    .map(tender => ({
      id: `T-${tender.id}`,
      title: tender.title,
      department: tender.department,
      budget: `₹${tender.budget}`,
      deadline: new Date(tender.deadline * 1000).toISOString().split('T')[0],
      status: tender.status
    }));

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowHero(true), 100),
      setTimeout(() => setShowStats(true), 500),
      setTimeout(() => setShowCharts(true), 900),
      setTimeout(() => setShowTenders(true), 1300),
    ];

    // Simulate blockchain network status
    const interval = setInterval(() => {
      console.log("Blockchain network status: Connected");
    }, 5000);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/0">
      {/* <NavBar /> */}
      
      {/* Hero Section */}
      <div className={`relative pt-7 pb-10 min-h-screen overflow-hidden ${fadeInClass} ${showHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="absolute inset-0 z-0 opacity-10 bg-grid-pattern bg-repeat"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-radial from-green-500/10 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container relative z-10 pt-[.35rem] pb-8 px-4">
          <div className="max-w-560">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400 mb-[2rem]">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Blockchain Powered Tender Management
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-8">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400">
                    Transform Government Tenders With <br/> Trustless Technology
                  </span> 
                </h1>
                <p className="text-lg text-gray-300 md:text-xl max-w-3xl mb-8 font-semibold">
                  Our blockchain-powered platform ensures complete transparency, eliminates corruption, 
                  and streamlines the entire tender process from publication to award.
                </p>
              </div>
              <div className="flex items-start justify-end mt-4 md:mt-0">
                <div className="flex flex-col items-end">
                  <TrueFocus 
                    sentence="Trust Chain"
                    manualMode={false}
                    blurAmount={5}
                    borderColor="green"
                    animationDuration={2}
                    pauseBetweenAnimations={1}
                  />
                  {/* <div className="mt-4">
                    <ClipPathImage 
                      imageUrl="./static/image.jpg" 
                      width="300px"
                      height="300px"
                      alt="Blockchain Technology"
                    />
                  </div> */}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button 
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-black font-medium px-6 py-2.5 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                asChild
              >
                <Link to="/tenders" className="group">
                  Explore Tenders
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              {/* <Button 
                variant="outline" 
                className="border-green-500/30 hover:border-green-500 text-white hover:text-green-400 bg-transparent"
                asChild
              >
                <Link to="/create-tender">
                  <Plus className="mr-2 h-4 w-4" /> Create New Tender
                </Link>
              </Button> */}
            </div>
          </div>
        </div>
      </div>
      
      <main className="container pt-20 pb-20">
        <div className="flex justify-between items-center my-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Tender Management Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Secure, transparent, and efficient tender process powered by blockchain
            </p>
            
          </div>
          
          <div className="flex items-center gap-4">            <Button asChild className="bg-gradient-to-r from-[rgba(80,252,149,0.8)] to-[rgba(0,255,144,0.6)] text-black hover:opacity-90">
              <Link to="/create-tender" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                New Tender
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${fadeInClass} ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <StatCard 
            title="Active Tenders" 
            value="28" 
            icon={<FileText className="h-5 w-5 text-[rgba(80,252,149,0.8)]" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard 
            title="Total Value" 
            value="$3.8M" 
            icon={<TrendingUp className="h-5 w-5 text-[rgba(80,252,149,0.8)]" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard 
            title="Registered Vendors" 
            value="96" 
            icon={<Users className="h-5 w-5 text-[rgba(80,252,149,0.8)]" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard 
            title="Disputes" 
            value="2" 
            icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
            trend={{ value: 1, isPositive: false }}
          />
        </div>
        
        {/* Charts & Tables Section */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 ${fadeInClass} ${showCharts ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="lg:col-span-1">
            <TenderStatusChart data={chartData} />
          </div>
          <div className="lg:col-span-2">
            <BlockchainVisualizer tenders={tenders} />
          </div>
        </div>
        
        {/* Recent Tenders Table */}
        <div className={`mb-8 ${fadeInClass} ${showTenders ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <RecentTendersTable tenders={recentTenders} />
        </div>
      </main>

      {/* Footer */}
      
    </div>
  );
};

export default Index;
