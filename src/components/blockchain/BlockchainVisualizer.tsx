import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tender } from "@/contexts/Web3Context";
import { ethers } from "ethers";

interface BlockchainVisualizerProps {
  tenders: Tender[];
  className?: string;
}

const BlockchainVisualizer = ({ tenders, className }: BlockchainVisualizerProps) => {
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  
  // Sort tenders by creation time (newest first)
  const sortedTenders = [...tenders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  
  useEffect(() => {
    // Auto-highlight each block in sequence for a demo effect
    const interval = setInterval(() => {
      setActiveBlock((prev) => {
        if (prev === null || prev >= sortedTenders.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [sortedTenders.length]);

  const getBlockTypeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'dark-block-type-tender';
      case 'closed':
        return 'dark-block-type-bid';
      case 'awarded':
        return 'dark-block-type-award';
      case 'disputed':
        return 'dark-block-type-dispute';
      default:
        return 'dark-block-type-tender';
    }
  };

  // Generate a deterministic hash based on tender data
  const generateHash = (tender: Tender): string => {
    const data = `${tender.id}-${tender.title}-${tender.creator}`;
    return ethers.utils.id(data).substring(0, 42);
  };

  return (
    <div className={cn("bg-gray-900/40 backdrop-blur-md rounded-xl border border-green-800 shadow-xl overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-green-800">
        <h3 className="text-lg font-medium text-[rgba(80, 252, 149, 0.8)]">Recent Blockchain Activity</h3>
      </div>
      
      <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
        {sortedTenders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No blockchain activity to display</p>
          </div>
        ) : (
          sortedTenders.map((tender, index) => {
            const isActive = activeBlock === index;
            const hash = generateHash(tender);
            const previousHash = index < sortedTenders.length - 1 
              ? generateHash(sortedTenders[index + 1]) 
              : '0x0000000000000000000000000000000000000000';
            
            let actionType = "Tender Created";
            if (tender.status === 'awarded') actionType = "Tender Awarded";
            if (tender.status === 'closed') actionType = "Tender Closed";
            if (tender.status === 'disputed') actionType = "Tender Disputed";
            
            return (
              <div 
                key={tender.id}
                className={cn(
                  "dark-block p-3 rounded-lg border transition-all duration-300",
                  getBlockTypeClass(tender.status),
                  isActive ? "border-[rgba(80, 252, 149, 0.8)] shadow-glow" : "border-gray-700"
                )}
                onMouseEnter={() => setActiveBlock(index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-white">{`Block #${tender.id}`}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(tender.createdAt * 1000).toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-1 mb-2">
                  <div className="text-xs text-gray-400">Hash:</div>
                  <div className="text-xs font-mono bg-gray-800 p-1 rounded overflow-hidden text-ellipsis">
                    {hash}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">Previous Hash:</div>
                  <div className="text-xs font-mono bg-gray-800 p-1 rounded overflow-hidden text-ellipsis">
                    {previousHash}
                  </div>
                </div>
                
                <div className="dark-block-data p-2 rounded bg-gray-800/50">
                  <div className="text-xs text-gray-300 mb-1">{actionType}</div>
                  <div className="text-sm font-medium text-white">{tender.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {tender.department} • Budget: ₹{tender.budget}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BlockchainVisualizer;
