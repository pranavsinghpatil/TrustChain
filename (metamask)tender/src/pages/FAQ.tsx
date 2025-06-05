import React, { useState } from 'react';

const FAQ = () => {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is TrustChain?",
      answer: "TrustChain is a blockchain-based tender management platform that ensures transparent and secure bidding processes for both public and private sector tenders."
    },
    {
      question: "How do I participate in a tender?",
      answer: "To participate, connect your wallet, browse available tenders, and submit your bid through our secure platform. Make sure to review all tender requirements before bidding."
    },
    {
      question: "Is my bid information secure?",
      answer: "Yes, all bid information is secured using blockchain technology. Only authorized parties can access the bid details, and the entire process is transparent and tamper-proof."
    },
    {
      question: "How are winners selected?",
      answer: "Winners are selected based on the tender criteria specified by the tender creator. The selection process is automated through smart contracts to ensure fairness."
    },
    {
      question: "What cryptocurrencies are supported?",
      answer: "Currently, we support Ethereum (ETH) for all transactions on our platform."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dark-card p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-700 last:border-0">
              <button
                className="w-full py-4 flex justify-between items-center text-left"
                onClick={() => setOpenItem(openItem === index ? null : index)}
              >
                <span className="text-lg font-semibold">{faq.question}</span>
                <span className="transform transition-transform duration-200">
                  {openItem === index ? '−' : '+'}
                </span>
              </button>
              {openItem === index && (
                <div className="pb-4 text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
