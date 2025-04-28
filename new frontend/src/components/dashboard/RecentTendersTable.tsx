
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
        return <Badge className="bg-blockchain-green text-white">Open</Badge>;
      case 'closed':
        return <Badge className="bg-blockchain-gray text-white">Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-blockchain-purple text-white">Awarded</Badge>;
      case 'disputed':
        return <Badge className="bg-blockchain-red text-white">Disputed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Recent Tenders</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenders.map((tender) => (
              <TableRow key={tender.id}>
                <TableCell className="font-medium">{tender.title}</TableCell>
                <TableCell>{tender.department}</TableCell>
                <TableCell>{tender.budget}</TableCell>
                <TableCell>{tender.deadline}</TableCell>
                <TableCell>{getStatusBadge(tender.status)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/tenders/${tender.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecentTendersTable;
