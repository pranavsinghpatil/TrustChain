import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dark-card p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">About TrustChain</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-300">
              TrustChain is revolutionizing the tender management process through blockchain technology, 
              ensuring transparency, security, and efficiency in public and private sector bidding.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="text-gray-300">
              We provide a decentralized platform for managing tenders and bids, leveraging smart 
              contracts to ensure fairness and eliminate fraud in the bidding process.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Transparency in all operations</li>
              <li>Security through blockchain technology</li>
              <li>Innovation in tender management</li>
              <li>Fairness in bidding processes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300">
              Have questions or want to learn more about our platform? 
              Reach out to us at support@trustchain.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
