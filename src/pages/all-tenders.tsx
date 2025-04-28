import React, { useState } from 'react';

const officers = [
  { id: 2, name: 'Oscar Officer', email: 'oscar@tender.com' },
  { id: 5, name: 'Olivia Officer', email: 'olivia@tender.com' },
];

const initialTenders = [
  { id: 'T-2025-001', title: 'Hospital Management System', officer: 2, status: 'Open', deadline: '2025-05-15' },
  { id: 'T-2025-002', title: 'Smart Traffic Control System', officer: 5, status: 'Open', deadline: '2025-05-05' },
  { id: 'T-2025-003', title: 'E-Learning Platform', officer: null, status: 'Closed', deadline: '2025-04-30' },
  { id: 'T-2025-004', title: 'City Waste Management', officer: 2, status: 'Awarded', deadline: '2025-04-20' },
];

const AllTenders = () => {
  const [tenders, setTenders] = useState(initialTenders);

  const handleAssignOfficer = (tenderId: string, officerId: number) => {
    setTenders(tenders.map(t => t.id === tenderId ? { ...t, officer: officerId } : t));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">All Tenders</h1>
      <div className="bg-white rounded shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Title</th>
              <th className="py-2">Status</th>
              <th className="py-2">Deadline</th>
              <th className="py-2">Assigned Officer</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((tender) => (
              <tr key={tender.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{tender.title}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${tender.status === 'Open' ? 'bg-green-100 text-green-800' : tender.status === 'Awarded' ? 'bg-purple-100 text-purple-800' : tender.status === 'Closed' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-800'}`}>{tender.status}</span>
                </td>
                <td className="py-2">{tender.deadline}</td>
                <td className="py-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={tender.officer || ''}
                    onChange={e => handleAssignOfficer(tender.id, Number(e.target.value))}
                  >
                    <option value="">Unassigned</option>
                    {officers.map(officer => (
                      <option key={officer.id} value={officer.id}>{officer.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <button className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllTenders;
