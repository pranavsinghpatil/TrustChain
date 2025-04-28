import React from 'react';
import Link from 'next/link';

const tender = {
  id: 'T-2025-001',
  title: 'Hospital Management System',
  department: 'Healthcare',
  budget: 250000,
  deadline: '2025-05-15',
  description:
    'Design and implementation of a comprehensive hospital management system including patient records, billing, pharmacy, and staff management modules. The system should be HIPAA compliant and integrate with existing healthcare systems.',
  selectionCriteria: [
    'Technical expertise in healthcare IT systems',
    'Previous experience with HIPAA compliant systems',
    'Cost-effectiveness',
    'Implementation timeline',
    'Support and maintenance plan',
  ],
  timeline: [
    { label: 'Tender Published', date: '2025-04-05' },
    { label: 'Bidding Deadline', date: '2025-05-15' },
    { label: 'Evaluation Completed', date: '2025-05-22' },
    { label: 'Winner Announcement', date: '2025-05-25' },
    { label: 'Contract Signing', date: '2025-06-10' },
  ],
  documents: [
    { name: 'Technical_Requirements.pdf', size: '2.4 MB' },
    { name: 'Legal_Terms.pdf', size: '1.1 MB' },
    { name: 'System_Architecture.pdf', size: '3.8 MB' },
  ],
  blockchain: [
    {
      date: '2025-04-05 08:30:22',
      action: 'Tender created and published on blockchain',
      tx: '0x3a42...a3b4c5',
    },
    {
      date: '2025-04-06 10:15:40',
      action: 'Vendor ABC submitted a bid',
      tx: '0xa695...823afd',
    },
    {
      date: '2025-04-10 14:22:05',
      action: 'Vendor XYZ submitted a bid',
      tx: '0xc87...d9cb7',
    },
    {
      date: '2025-04-15 09:05:18',
      action: 'Vendor DEF submitted a bid',
      tx: '0x1a2b...e0f1a2',
    },
  ],
  contractAddress: '0x3a42ed8d7f9e9c9b43d5e24a313f65d6a9e1b2c3d',
  bidsReceived: 5,
  publishedOn: '2025-04-05',
};

const TenderDetails = () => {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Link href="/tenders" className="text-blue-600 hover:underline">&larr; Back to Tenders</Link>
      </div>
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{tender.title}</h1>
            <div className="flex gap-4 text-gray-600 text-sm mb-1">
              <span>Budget: ${tender.budget.toLocaleString()}</span>
              <span>Department: {tender.department}</span>
              <span>Deadline: {tender.deadline}</span>
            </div>
            <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">Open for Bidding</span>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded font-semibold mt-4 md:mt-0">Submit Bid</button>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Tender Description</h2>
            <p className="mb-4">{tender.description}</p>
            <h3 className="font-semibold mb-1">Selection Criteria</h3>
            <ul className="list-disc list-inside mb-4">
              {tender.selectionCriteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <h3 className="font-semibold mb-1">Timeline</h3>
            <ul className="mb-4">
              {tender.timeline.map((item, i) => (
                <li key={i} className="flex items-center gap-2 mb-1">
                  <span className="text-green-600">●</span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-gray-500 text-xs">{item.date}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-80 bg-gray-50 rounded p-4 flex-shrink-0">
            <h3 className="font-semibold mb-2">Tender Summary</h3>
            <div className="text-sm mb-1">Published On: {tender.publishedOn}</div>
            <div className="text-sm mb-1">Bids Received: {tender.bidsReceived}</div>
            <div className="text-sm mb-1">Blockchain Status: <span className="text-green-600 font-semibold">Verified ✓</span></div>
            <div className="text-sm mb-1">Security: IPFS + Smart Contract</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Transparency</h4>
              <div className="text-xs bg-purple-100 text-purple-800 rounded px-2 py-1 break-words">Contract Address: {tender.contractAddress}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex gap-8 mb-4">
          <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold">Details</button>
          <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold">Documents</button>
          <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold">Blockchain</button>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Tender Documents</h3>
          <ul>
            {tender.documents.map((doc, i) => (
              <li key={i} className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-blue-200 rounded mr-2"></span>
                  <span>{doc.name}</span>
                </span>
                <span className="text-xs text-gray-500">{doc.size}</span>
                <button className="text-blue-600 hover:underline text-sm">View</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Blockchain Transactions</h3>
          <ul>
            {tender.blockchain.map((tx, i) => (
              <li key={i} className="mb-2">
                <div className="text-xs text-gray-600">{tx.date}</div>
                <div className="text-sm">{tx.action}</div>
                <div className="text-xs bg-gray-100 rounded px-2 py-1 inline-block mt-1">{tx.tx}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TenderDetails;
