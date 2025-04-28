import React from 'react';

const MyBids = () => {
  // This will be replaced with real data and API calls
  const activeBids = [
    {
      id: 'BID-2025-001',
      tender: 'Hospital Management System',
      department: 'Healthcare',
      submitted: '2025-04-08',
      deadline: '2025-05-15',
      amount: 235000,
      winProbability: 76,
      status: 'Under Evaluation',
    },
    {
      id: 'BID-2025-002',
      tender: 'Smart Traffic Control System',
      department: 'Infrastructure',
      submitted: '2025-04-12',
      deadline: '2025-05-05',
      amount: 490000,
      winProbability: 62,
      status: 'Under Evaluation',
    },
  ];

  const wonContracts = 2;
  const successRate = 67;
  const totalValue = 440000;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Bids</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold">Active Bids</div>
          <div className="text-2xl">{activeBids.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold">Won Contracts</div>
          <div className="text-2xl">{wonContracts}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold">Success Rate</div>
          <div className="text-2xl">{successRate}%</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold">Total Value</div>
          <div className="text-2xl">${totalValue / 1000}K</div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Bids</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Tender</th>
              <th className="py-2">Department</th>
              <th className="py-2">Bid Amount</th>
              <th className="py-2">Submitted</th>
              <th className="py-2">Deadline</th>
              <th className="py-2">Win Probability</th>
              <th className="py-2">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {activeBids.map((bid) => (
              <tr key={bid.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{bid.tender}</td>
                <td className="py-2">{bid.department}</td>
                <td className="py-2">${bid.amount.toLocaleString()}</td>
                <td className="py-2">{bid.submitted}</td>
                <td className="py-2">{bid.deadline}</td>
                <td className="py-2">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{ width: `${bid.winProbability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{bid.winProbability}%</span>
                  </div>
                </td>
                <td className="py-2">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                    {bid.status}
                  </span>
                </td>
                <td className="py-2">
                  <button className="text-blue-600 hover:underline">View Tender</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyBids;
