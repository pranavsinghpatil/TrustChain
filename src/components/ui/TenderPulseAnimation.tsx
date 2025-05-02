import React, { useEffect, useState } from 'react';
import { BadgeIndianRupee, Shield, CheckCircle, FileCheck } from 'lucide-react';

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
    <div className="relative w-full h-60 flex items-center justify-center">
      <div className={`transition-all duration-1000 transform ${isActive ? 'opacity-100' : 'opacity-0 scale-90'}`}>
        {/* Center tender icon */}
        <div className="relative top-[-400px] right-[-65px]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-400 rounded-full animate-pulse"></div>
          <div className="relative z-10 bg-[#1B1B1B]/80 p-4 rounded-full border border-green-400 shadow-lg flex items-center justify-center">
            <BadgeIndianRupee className="h-8 w-8 text-green-400" />
          </div>

          {/* Ripple effects */}
          {isActive && (
            <>
              <div className="absolute inset-0 border-2 border-green-400/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-[-8px] border border-green-400/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </>
          )}
        </div>
      </div>

      {/* Connected nodes */}
      <div className={`absolute transition-all duration-1000 delay-500 transform ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-450px] right-[-57px]">
          {/* Node 1 - Submit */}
          <div className="absolute top-[120px] left-[7px] bg-[#1B1B1B]/80 p-2 rounded-md border border-green-400/30 flex items-center gap-2 animate-float" style={{ animationDelay: "0.2s" }}>
            <Shield className="h-4 w-4 text-green-400" />
            <div className="text-white text-xs">Submit</div>
          </div>

          {/* Node 2 - Verify */}
          <div className="absolute top-[30px] right-[50px] bg-[#1B1B1B]/80 p-2 rounded-md border border-green-400/30 flex items-center gap-2 animate-float" style={{ animationDelay: "0.4s" }}>
            <CheckCircle className="h-4 w-4 text-green-400" />
            <div className="text-white text-xs">Verify</div>
          </div>

          {/* Node 3 - Approve */}
          <div className="absolute bottom-[-40px] right-[-150px] bg-[#1B1B1B]/80 p-2 rounded-md border border-green-400/30 flex items-center gap-2 animate-float" style={{ animationDelay: "0.6s" }}>
            <FileCheck className="h-4 w-4 text-green-400" />
            <div className="text-white text-xs">Approve</div>
          </div>

          {/* Connection lines */}
          {/* <div className="absolute top-[-20px] left-[-30px] h-1 w-40 bg-gradient-to-r from-green-400/50 via-green-400 to-transparent transform rotate-[15deg]"></div>
        <div className="absolute top-[-30px] right-[10px] h-1 w-40 bg-gradient-to-r from-transparent via-green-400 to-green-400/50 transform rotate-[-15deg]"></div>
        <div className="absolute bottom-[-20px] right-[-20px] h-1 w-40 bg-gradient-to-r from-green-400/50 via-green-400 to-transparent transform rotate-[25deg]"></div> */}

          {/* Data packets moving along connections */}
          {/* {isActive && (
            <>
              <div className="absolute top-[-18px] left-[-20px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "0s" }}></div>
              <div className="absolute top-[-28px] right-[20px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "1s" }}></div>
              <div className="absolute bottom-[-18px] right-[-10px] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#4ADE80] animate-[moveLeftToRight_4s_linear_infinite]" style={{ animationDelay: "2s" }}></div>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default TenderPulseAnimation;
