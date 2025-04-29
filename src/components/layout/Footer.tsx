import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="w-full glass-footer text-center pt-8 pb-0 text-xs text-gray-400" style={{margin:0, borderRadius:0, boxShadow:'none'}}>
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">TrustChain</h3>
        <p className="text-sm">Secure and transparent tender management powered by blockchain.</p>
      </div>
      <div>
        <h4 className="text-lg font-medium text-white mb-2">Explore</h4>
        <ul className="space-y-1 text-sm">
          <li><Link to="/" className="hover:text-white">Home</Link></li>
          <li><Link to="/tenders" className="hover:text-white">Tenders</Link></li>
          <li><Link to="/create-tender" className="hover:text-white">Create Tender</Link></li>
          <li><Link to="/reports" className="hover:text-white">Reports</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-medium text-white mb-2">Contact & Policy</h4>
        <ul className="space-y-1 text-sm">
          <li><a href="mailto:support@trustchain.gov.in" className="hover:text-white">Contact Us</a></li>
          <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
          <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
        </ul>
      </div>
    </div>
    <div className="text-center text-xs text-gray-500 mt-8">
      {new Date().getFullYear()} Government of India - TrustChain Initiative.
    </div>
  </footer>
);

export default Footer;
