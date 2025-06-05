import React, { useEffect, useState } from 'react';
import { BadgeIndianRupee } from 'lucide-react';

const TenderPulseAnimation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    // Add a slight delay before starting the animation
    const timer = setTimeout(() => {
      setIsActive(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden">
      <div className={`transition-all duration-1000 transform ${isActive ? 'opacity-100' : 'opacity-0 scale-90'}`}>
        {/* Center tender icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blockchain-blue to-blockchain-accent rounded-full animate-pulse-slow"></div>
          <div className="relative z-10 bg-blockchain-panel p-4 rounded-full border border-blockchain-accent shadow-lg flex items-center justify-center">
            <BadgeIndianRupee className="h-8 w-8 text-blockchain-accent" />
          </div>
          
          {/* Ripple effects */}
          {isActive && (
            <>
              <div className="absolute inset-0 border-2 border-blockchain-accent/30 rounded-full animate-ping" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}></div>
              <div className="absolute inset-[-8px] border border-blockchain-accent/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s', animationIterationCount: 'infinite' }}></div>
              <div className="absolute inset-[-16px] border border-blockchain-accent/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s', animationIterationCount: 'infinite' }}></div>
            </>
          )}
        </div>
      </div>
      
      {/* Connected nodes */}
      <div className={`absolute transition-all duration-1000 delay-500 transform ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 left-[-80px] bg-blockchain-panel p-2 rounded-md border border-blockchain-accent/30 text-xs flex items-center justify-center animate-float" style={{ animationDelay: "0.2s" }}>
          <div className="text-white text-xs">Submit</div>
        </div>
        
        <div className="absolute top-[-30px] left-[60px] bg-blockchain-panel p-2 rounded-md border border-blockchain-accent/30 text-xs flex items-center justify-center animate-float" style={{ animationDelay: "0.4s" }}>
          <div className="text-white text-xs">Review</div>
        </div>
        
        <div className="absolute top-[10px] right-[-70px] bg-blockchain-panel p-2 rounded-md border border-blockchain-accent/30 text-xs flex items-center justify-center animate-float" style={{ animationDelay: "0.6s" }}>
          <div className="text-white text-xs">Award</div>
        </div>
        
        <div className="absolute bottom-[-20px] left-[30px] bg-blockchain-panel p-2 rounded-md border border-blockchain-accent/30 text-xs flex items-center justify-center animate-float" style={{ animationDelay: "0.8s" }}>
          <div className="text-white text-xs">Approve</div>
        </div>
        
        {/* Connection lines */}
        <div className="absolute top-[10px] left-[-40px] h-1 w-40 bg-gradient-to-r from-blockchain-accent/50 via-blockchain-accent to-transparent transform rotate-[15deg]"></div>
        <div className="absolute top-[-15px] left-[20px] h-1 w-40 bg-gradient-to-r from-transparent via-blockchain-accent to-blockchain-accent/50 transform rotate-[-15deg]"></div>
        <div className="absolute top-[20px] left-[40px] h-1 w-40 bg-gradient-to-r from-blockchain-accent/50 via-blockchain-accent to-transparent transform rotate-[25deg]"></div>
        <div className="absolute top-[30px] left-[0px] h-1 w-40 bg-gradient-to-r from-transparent via-blockchain-accent to-blockchain-accent/50 transform rotate-[-45deg]"></div>
        
        {/* Data packets moving along connections */}
        {isActive && (
          <>
            <div className="absolute top-[10px] left-[-30px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "0s" }}></div>
            <div className="absolute top-[-12px] left-[30px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "1s" }}></div>
            <div className="absolute top-[23px] left-[50px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "2s" }}></div>
            <div className="absolute top-[28px] left-[10px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "3s" }}></div>
          </>
        )}
      </div>
    </div>
  );
};

export default TenderPulseAnimation;
