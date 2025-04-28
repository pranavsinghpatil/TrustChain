import React, { useState } from 'react';
import { useRouter } from 'next/router';

const mockBids = [
  {
    id: 'BID-2025-001',
    bidder: 'Vendor ABC',
    amount: 235000,
    submitted: '2025-04-08',
    proposal: 'Proposal document link',
    status: 'Under Evaluation',
  },
  {
    id: 'BID-2025-002',
    bidder: 'Vendor XYZ',
    amount: 240000,
    submitted: '2025-04-10',
    proposal: 'Proposal document link',
    status: 'Under Evaluation',
  },
  {
    id: 'BID-2025-003',
    bidder: 'Vendor DEF',
    amount: 250000,
    submitted: '2025-04-15',
    proposal: 'Proposal document link',
    status: 'Under Evaluation',
  },
];

const TenderBids = () => {
  const [winner, setWinner] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectWinner = (bidId: string) => {
    setWinner(bidId);
    // TODO: Integrate blockchain awarding logic
    alert(`Bid ${bidId} awarded as winner!`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Bids Received</h1>
      <div className="bg-white rounded shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Bidder</th>
              <th className="py-2">Bid Amount</th>
              <th className="py-2">Submitted</th>
              <th className="py-2">Proposal</th>
              <th className="py-2">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockBids.map((bid) => (
              <tr key={bid.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{bid.bidder}</td>
                <td className="py-2">${bid.amount.toLocaleString()}</td>
                <td className="py-2">{bid.submitted}</td>
                <td className="py-2">
                  <a href="#" className="text-blue-600 hover:underline">View Proposal</a>
                </td>
                <td className="py-2">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                    {winner === bid.id ? 'Winner' : bid.status}
                  </span>
                </td>
                <td className="py-2">
                  {winner === null && (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700"
                      onClick={() => handleSelectWinner(bid.id)}
                    >
                      Award
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold"
        onClick={() => router.back()}
      >
        Back to Tender
      </button>
    </div>
  );
};

export default TenderBids;
