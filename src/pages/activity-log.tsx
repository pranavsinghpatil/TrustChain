import React from 'react';

const activityLog = [
  { time: '2025-04-27 10:05', action: 'Tender "Hospital Management System" created by Oscar Officer' },
  { time: '2025-04-27 10:10', action: 'Bid submitted by Vendor ABC for "Hospital Management System"' },
  { time: '2025-04-27 10:15', action: 'Tender "City Waste Management" closed by Oscar Officer' },
  { time: '2025-04-27 10:20', action: 'User Betty Bidder registered' },
  { time: '2025-04-27 10:25', action: 'Tender Officer Olivia Officer added by Alice Admin' },
  { time: '2025-04-27 10:30', action: 'Bid submitted by Vendor XYZ for "Hospital Management System"' },
  { time: '2025-04-27 10:35', action: 'Tender "Smart Traffic Control System" assigned to Olivia Officer' },
];

const ActivityLog = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
    <div className="bg-white rounded shadow p-6">
      <ul className="divide-y divide-gray-200">
        {activityLog.map((entry, i) => (
          <li key={i} className="py-3 flex gap-4 items-center">
            <span className="text-xs text-gray-400 w-40">{entry.time}</span>
            <span className="text-gray-700">{entry.action}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default ActivityLog;
