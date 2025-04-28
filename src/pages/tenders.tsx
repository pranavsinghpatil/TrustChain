import React, { useState } from 'react';
import Link from 'next/link';

const tenders = [
  {
    id: 'T-2025-001',
    title: 'Hospital Management System',
    department: 'Healthcare',
    budget: 250000,
    deadline: '2025-05-15',
    status: 'Open',
    bids: 5,
  },
  {
    id: 'T-2025-002',
    title: 'Smart Traffic Control System',
    department: 'Infrastructure',
    budget: 500000,
    deadline: '2025-05-05',
    status: 'Open',
    bids: 8,
  },
  {
    id: 'T-2025-003',
    title: 'E-Learning Platform',
    department: 'Education',
    budget: 175000,
    deadline: '2025-04-30',
    status: 'Closed',
    bids: 4,
  },
  {
    id: 'T-2025-004',
    title: 'City Waste Management',
    department: 'Municipal',
    budget: 380000,
    deadline: '2025-04-20',
    status: 'Awarded',
    bids: 6,
  },
];

const TenderList = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch = tender.title.toLowerCase().includes(search.toLowerCase()) ||
      tender.department.toLowerCase().includes(search.toLowerCase()) ||
      tender.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || tender.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tenders</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">+ New Tender</button>
      </div>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search tenders by title, department or ID..."
          className="border rounded px-3 py-2 w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Tenders</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Awarded">Awarded</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredTenders.map((tender) => (
          <div key={tender.id} className="bg-white rounded shadow p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${tender.status === 'Open' ? 'bg-green-100 text-green-800' : tender.status === 'Closed' ? 'bg-gray-200 text-gray-700' : 'bg-purple-100 text-purple-800'}`}>{tender.status}</span>
                <span className="text-xs text-gray-400">ID: {tender.id}</span>
              </div>
              <h2 className="text-lg font-bold mb-1">{tender.title}</h2>
              <div className="text-sm text-gray-600 mb-1">{tender.department}</div>
              <div className="text-sm text-gray-600 mb-1">Budget: ${tender.budget.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mb-3">Deadline: {tender.deadline}</div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-gray-500">{tender.bids} bids submitted</span>
              <Link href={`/tenders/${tender.id}`} className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-600">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenderList;
