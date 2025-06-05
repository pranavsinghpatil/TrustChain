import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Tender {
  id: string;
  title: string;
  department: string;
  budget: string;
  deadline: string;
  status: 'open' | 'closed' | 'awarded' | 'disputed';
}

interface RecentTendersTableProps {
  tenders: Tender[];
}

const RecentTendersTable = ({ tenders }: RecentTendersTableProps) => {
  const getStatusBadge = (status: Tender['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.9)] text-black">Open</Badge>;
      case 'closed':
        return <Badge className="bg-[rgba(156,163,175,0.8)] hover:bg-[rgba(156,163,175,0.9)] text-white">Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-[rgba(59,130,246,0.8)] hover:bg-[rgba(59,130,246,0.9)] text-white">Awarded</Badge>;
      case 'disputed':
        return <Badge className="bg-[rgba(239,68,68,0.8)] hover:bg-[rgba(239,68,68,0.9)] text-white">Disputed</Badge>;
      default:
        return <Badge className="bg-gray-600 hover:bg-gray-700 text-white">Unknown</Badge>;
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-green-800 flex justify-between items-center">
        <h3 className="text-lg font-medium text-[rgba(80,252,149,0.8)]">Recent Tenders</h3>
        <Link to="/tenders" className="text-xs text-[rgba(80,252,149,0.8)] hover:text-[rgba(80,252,149,1)] transition-colors">
          View all tenders
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-green-800/30">
              <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(80,252,149,0.8)] uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(80,252,149,0.8)] uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(80,252,149,0.8)] uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(80,252,149,0.8)] uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(80,252,149,0.8)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[rgba(80,252,149,0.8)] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-800/20">
            {tenders.map((tender) => (
              <tr key={tender.id} className="hover:bg-green-800/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{tender.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tender.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tender.budget}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tender.deadline}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(tender.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="border-green-800 text-black bg-[rgba(80,252,149,0.8)] hover:bg-[rgba(80,252,149,0.8)] transition-colors"
                  >
                    <Link to={`/tenders/${tender.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {tenders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No recent tenders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTendersTable;
