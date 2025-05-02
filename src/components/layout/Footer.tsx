import React from "react";
import { Globe, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Github, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import { GitHub } from "@mui/icons-material";
import GitHubStarButton from '@/components/ui/GitStar';


const Footer: React.FC = () => (
  <footer className="glass-footer w-full-[] pt-10 pb-12 text-gray-400" style={{ margin: 0, borderRadius: 0, boxShadow: 'none' }}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Company Info */}
        {/* <div className="text-left">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-black" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">TrustChain</h3>
          <p className="text-base leading-relaxed">
            Revolutionizing government procurement through blockchain technology. Ensuring transparency, efficiency, and trust in tender management.
          </p>
        </div> */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 p-2 rounded-lg">
              <HeartHandshake className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white">TrustChain</h3>
          </div>
          <h5 className="text-gray-400 text-sm">
            Revolutionizing government procurement through blockchain technology.
            Ensuring transparency, efficiency, and trust in tender management.
          </h5>
        </div>

        {/* Quick Links */}
        {/* <div className="text-left">
          <h4 className="text-xl font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-3 text-base">
            <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
            <li><Link to="/tenders" className="text-gray-400 hover:text-white">Active Tenders</Link></li>
            <li><Link to="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
            <li><Link to="/faqs" className="text-gray-400 hover:text-white">FAQs</Link></li>
          </ul>
        </div> */}
        <div>
          <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-gray-400 hover:text-green-400 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/tenders" className="text-gray-400 hover:text-green-400 transition-colors">
                Active Tenders
              </Link>
            </li>
            <li>
              <a href="https://github.com/pranavsinghpatil/tender/issues/new/choose" target="_blank" className="text-gray-400 hover:text-green-400 transition-colors">
                Help Center [Raise a New Issue]
              </a>
            </li>
            <li>
              <Link to="/FAQ" className="text-gray-400 hover:text-green-400 transition-colors">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4 text-green-400" />
              Block 3, CGO Complex, Wagholi, Pune
            </li>
            <li className="flex items-center gap-2 text-gray-400">
              <Phone className="w-4 h-4 text-green-400" />
              1800-123-4567
            </li>
            <li className="flex items-center gap-2 text-gray-400 group">
              <Mail className="w-4 h-4 text-green-400" />
              <button
                onClick={() => window.location.href = "mailto:support@trustchain.gov.in"}
                className="hover:text-green-400 transition-colors"
              >
                support@trustchain.gov.in
              </button>
            </li>
            <li className="flex items-center gap-2 text-gray-400 group">
              <Globe className="w-4 h-4 text-green-400" />
              <button
                onClick={() => window.open("https://www.trustchain.gov.in", "_blank")}
                className="hover:text-green-400 transition-colors"
              >
                www.trustchain.gov.in
              </button>
            </li>
          </ul>
        </div>

        {/* Connect With Us */}
        <div>
          <h4 className="font-semibold mb-4 text-white">Connect With Us</h4>
          <div className="flex gap-4">
            <a href="#" className="p-2 rounded-full bg-[#1B1B1B]/80 border border-gray-700/50 hover:bg-blue-400 text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-[#1B1B1B]/80 border border-gray-700/50 hover:bg-[rgba(80,252,149,0.8)] text-gray-400 hover:text-black transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-[#1B1B1B]/80 border border-gray-700/50 hover:bg-blue-900 text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-[#1B1B1B]/80 border border-gray-700/50 hover:bg-gradient-to-br from-purple-600 to-pink-500 text-gray-400 hover:text-white transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
          <span className="flex items-center gap-2 mt-10">
          <GitHubStarButton 
            username="pranavsinghpatil" 
            repo="tender" 
            size="large"
            darkMode={true} // Set to true for dark background like your example
          />
          </span>
        </div>
      </div>

      <div className="mt-12 pt-4 pb-4 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            {new Date().getFullYear()} TrustChain. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link>
            <Link to="/faq" className="text-gray-400 hover:text-white">FAQs</Link>
            <Link to="/terms" className="text-gray-400 hover:text-white">Terms</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
            <Link to="/sitemap" className="text-gray-400 hover:text-white">Sitemap</Link>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
