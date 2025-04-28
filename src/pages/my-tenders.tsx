import React, { useState } from 'react';
import Link from 'next/link';

const initialTenders = [
  {
    id: 'T-2025-001',
    title: 'Hospital Management System',
    status: 'Open',
    deadline: '2025-05-15',
    bids: 5,
  },
  {
    id: 'T-2025-004',
    title: 'City Waste Management',
    status: 'Awarded',
    deadline: '2025-04-20',
    bids: 6,
  },
  {
    id: 'T-2025-006',
    title: 'Public Transport Ticketing System',
    status: 'Disputed',
    deadline: '2025-04-10',
    bids: 4,
  },
];

const MyTenders = () => {
  const [tenders, setTenders] = useState(initialTenders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleEdit = (tender: any) => {
    setEditingId(tender.id);
    setEditTitle(tender.title);
  };

  const handleSave = (id: string) => {
    setTenders(tenders.map(t => t.id === id ? { ...t, title: editTitle } : t));
    setEditingId(null);
  };

  const handleClose = (id: string) => {
    setTenders(tenders.map(t => t.id === id ? { ...t, status: 'Closed' } : t));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">My Tenders</h1>
      <div className="mb-6 flex justify-end">
        <Link href="/create-tender" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">+ New Tender</Link>
      </div>
      <div className="bg-white rounded shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Title</th>
              <th className="py-2">Status</th>
              <th className="py-2">Deadline</th>
              <th className="py-2">Bids</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((tender) => (
              <tr key={tender.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">
                  {editingId === tender.id ? (
                    <input
                      className="border rounded px-2 py-1"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                    />
                  ) : (
                    tender.title
                  )}
                </td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${tender.status === 'Open' ? 'bg-green-100 text-green-800' : tender.status === 'Awarded' ? 'bg-purple-100 text-purple-800' : tender.status === 'Closed' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-800'}`}>{tender.status}</span>
                </td>
                <td className="py-2">{tender.deadline}</td>
                <td className="py-2">{tender.bids}</td>
                <td className="py-2 flex gap-2">
                  <Link href={`/tenders/${tender.id}`} className="text-blue-600 hover:underline">View</Link>
                  <Link href={`/tenders/${tender.id}/bids`} className="text-green-600 hover:underline">Bids</Link>
                  {editingId === tender.id ? (
                    <>
                      <button className="text-green-700 font-semibold hover:underline" onClick={() => handleSave(tender.id)}>Save</button>
                      <button className="text-gray-600 hover:underline" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="text-gray-600 hover:underline" onClick={() => handleEdit(tender)}>Edit</button>
                  )}
                  <button className="text-red-600 hover:underline" onClick={() => handleClose(tender.id)}>Close</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyTenders;
