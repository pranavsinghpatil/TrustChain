import React from 'react';

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dark-card p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using TrustChain, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
            <p className="text-gray-300">
              Users must maintain accurate information and secure their wallet credentials. 
              Any fraudulent activity will result in immediate account termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Tender Participation</h2>
            <p className="text-gray-300">
              Users must ensure all submitted bid information is accurate and valid. 
              Once submitted, bids are final and recorded on the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Smart Contract Interactions</h2>
            <p className="text-gray-300">
              Users acknowledge that interactions with smart contracts are irreversible 
              and should be conducted with careful consideration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Liability</h2>
            <p className="text-gray-300">
              TrustChain is not liable for any losses incurred through platform use, 
              including but not limited to transaction failures or smart contract issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Modifications</h2>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. Users will be notified 
              of any changes through the platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
