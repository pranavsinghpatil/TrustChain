import React from 'react';
import { FileCheck, FileText, Shield, BadgeIndianRupee, Lock } from 'lucide-react';

const ContractIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-60 flex items-center justify-center overflow-hidden">
      {/* Main contract document */}
      <div className="absolute flex flex-col items-center group">
        <div className="relative bg-blockchain-panel p-4 rounded-md border border-blockchain-accent/30 shadow-lg transform transition-all duration-700 group-hover:translate-y-[-10px]">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blockchain-accent" />
              <div className="text-sm font-medium text-white">Smart Contract</div>
            </div>
            
            <div className="space-y-2">
              {/* Contract code lines */}
              <div className="h-2 bg-gray-700 rounded-full w-28"></div>
              <div className="h-2 bg-gray-700 rounded-full w-36"></div>
              <div className="h-2 bg-gray-700 rounded-full w-24"></div>
              <div className="h-2 bg-blockchain-accent/40 rounded-full w-32"></div>
              <div className="h-2 bg-gray-700 rounded-full w-20"></div>
              <div className="h-2 bg-blockchain-accent/40 rounded-full w-28"></div>
            </div>
            
            {/* Document elements */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="h-3 w-3 text-blockchain-accent" />
                <div className="h-2 bg-gray-700 rounded-full w-12 ml-2"></div>
              </div>
              <div className="flex items-center">
                <BadgeIndianRupee className="h-3 w-3 text-blockchain-accent" />
                <div className="h-2 bg-gray-700 rounded-full w-8 ml-2"></div>
              </div>
            </div>
          </div>
          
          {/* Glowing border on hover */}
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blockchain-accent/0 via-blockchain-accent/30 to-blockchain-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </div>
        
        {/* Blockchain validation effect */}
        <div className="h-16 w-1 bg-gradient-to-b from-transparent via-blockchain-accent to-transparent mt-2 opacity-50"></div>
        
        <div className="mt-2 bg-blockchain-panel p-2 rounded-md border border-blockchain-accent/30 flex items-center space-x-2 transform transition-all duration-700 group-hover:translate-y-[10px]">
          <Shield className="h-4 w-4 text-blockchain-accent animate-pulse-slow" />
          <div className="text-xs text-white">Verified on Chain</div>
          <FileCheck className="h-4 w-4 text-blockchain-accent" />
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-6 left-20 bg-blockchain-panel p-1 rounded-md border border-blockchain-accent/20 text-xs flex items-center transform rotate-[-15deg] animate-float" style={{ animationDelay: "0.5s" }}>
        <BadgeIndianRupee className="h-3 w-3 text-blockchain-accent mr-1" />
        <span className="text-white">Tender</span>
      </div>
      
      <div className="absolute bottom-10 right-24 bg-blockchain-panel p-1 rounded-md border border-blockchain-accent/20 text-xs flex items-center transform rotate-[10deg] animate-float" style={{ animationDelay: "1.2s" }}>
        <Lock className="h-3 w-3 text-blockchain-accent mr-1" />
        <span className="text-white">Secure</span>
      </div>
      
      {/* Animated connecting lines */}
      <div className="absolute inset-0">
        <div className="absolute top-8 left-24 h-16 w-1 bg-gradient-to-b from-transparent via-blockchain-accent/20 to-transparent transform rotate-[40deg]"></div>
        <div className="absolute bottom-12 right-28 h-16 w-1 bg-gradient-to-b from-transparent via-blockchain-accent/20 to-transparent transform rotate-[-40deg]"></div>
      </div>
    </div>
  );
};

export default ContractIllustration;