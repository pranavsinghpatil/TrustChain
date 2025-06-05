import React from 'react';
import { Link } from 'react-router-dom';

const Sitemap = () => {
  const siteStructure = [
    {
      section: "Main Pages",
      links: [
        { name: "Home", path: "/" },
        { name: "About Us", path: "/about" },
        { name: "FAQs", path: "/faq" }
      ]
    },
    {
      section: "Tender Management",
      links: [
        { name: "Active Tenders", path: "/tenders" },
        { name: "My Bids", path: "/my-bids" },
        { name: "Reports", path: "/reports" }
      ]
    },
    {
      section: "Legal",
      links: [
        { name: "Terms of Service", path: "/terms" },
        { name: "Privacy Policy", path: "/privacy" }
      ]
    },
    {
      section: "Support",
      links: [
        { name: "Contact Us", path: "/contact" },
        { name: "Documentation", path: "/docs" }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dark-card p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Sitemap</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {siteStructure.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold mb-4">{section.section}</h2>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.path}
                      className="text-gray-300 hover:text-green-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
