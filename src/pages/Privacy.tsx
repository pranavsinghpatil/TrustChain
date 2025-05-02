import React from 'react';

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dark-card p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Collection</h2>
            <p className="text-gray-300">
              We collect wallet addresses and transaction data necessary for platform operation. 
              Personal information is never stored off-chain without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Usage</h2>
            <p className="text-gray-300">
              Collected information is used solely for platform functionality, including:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-300">
              <li>Processing tender submissions</li>
              <li>Managing bid transactions</li>
              <li>Verifying user identity</li>
              <li>Platform analytics and improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Blockchain Data</h2>
            <p className="text-gray-300">
              All on-chain data is public and immutable. Users should be aware that 
              transaction history and wallet interactions are visible to all network participants.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-300">
              We implement robust security measures to protect user data, but cannot guarantee 
              absolute security of information transmitted through the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Rights</h2>
            <p className="text-gray-300">
              Users have the right to:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-300">
              <li>Access their personal data</li>
              <li>Request data modification</li>
              <li>Delete off-chain data</li>
              <li>Opt-out of non-essential data collection</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
