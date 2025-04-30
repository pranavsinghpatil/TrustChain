import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="glass-footer w-full text-center pt-10 pb-0 text-xs text-gray-400" style={{margin:0, borderRadius:0, boxShadow:'none'}}>
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">TrustChain</h3>
        <p className="text-base text-gray-300">Secure and transparent tender management powered by blockchain.</p>
      </div>
      <div>
        <h4 className="text-lg font-bold text-white mb-2">Explore</h4>
        <ul className="space-y-1 text-base">
          <li><Link to="/" className="hover:text-[#00ff90] transition-colors">Home</Link></li>
          <li><Link to="/tenders" className="hover:text-[#00ff90] transition-colors">Tenders</Link></li>
          <li><Link to="/create-tender" className="hover:text-[#00ff90] transition-colors">Create Tender</Link></li>
          <li><Link to="/reports" className="hover:text-[#00ff90] transition-colors">Reports</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-bold text-white mb-2">Contact & Policy</h4>
        <ul className="space-y-1 text-base">
          <li><a href="mailto:support@trustchain.gov.in" className="hover:text-[#00ff90] transition-colors">Contact Us</a></li>
          <li><Link to="/privacy" className="hover:text-[#00ff90] transition-colors">Privacy Policy</Link></li>
          <li><Link to="/terms" className="hover:text-[#00ff90] transition-colors">Terms of Service</Link></li>
        </ul>
      </div>
    </div>
    <div className="text-center text-xs text-gray-500 mt-8">
      &copy; {new Date().getFullYear()} TrustChain. All rights reserved.
    </div>
  </footer>
);

export default Footer;
