import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Block {
  id: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  data: {
    type: string;
    title: string;
    action?: string;
  };
}

interface BlockchainVisualizerProps {
  blocks: Block[];
  className?: string;
}

const BlockchainVisualizer = ({ blocks, className }: BlockchainVisualizerProps) => {
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  
  useEffect(() => {
    // Auto-highlight each block in sequence for a demo effect
    const interval = setInterval(() => {
      setActiveBlock((prev) => {
        if (prev === null || prev >= blocks.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [blocks.length]);

  const getBlockTypeClass = (type: string) => {
    switch (type) {
      case 'tender':
        return 'dark-block-type-tender';
      case 'bid':
        return 'dark-block-type-bid';
      case 'award':
        return 'dark-block-type-award';
      case 'dispute':
        return 'dark-block-type-dispute';
      default:
        return 'dark-block-type-tender';
    }
  };
  
  const formatHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div className={cn("dark-card bg-gray-900/40 backdrop-blur-md rounded-xl shadow-xl overflow-hidden", className)}>
      <div className="blockchain-ledger-header">
        <div>
          <h3 className="blockchain-ledger-title">Blockchain Ledger</h3>
          <p className="blockchain-ledger-subtitle">
            Immutable record of tender activities secured by blockchain
          </p>
        </div>
      </div>
      
      <div className="blockchain-ledger">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={cn(
              "dark-block",
              activeBlock === index ? "border-[rgba(80,252,149,0.4)] bg-[rgba(17,25,40,0.8)]" : ""
            )}
            onClick={() => setActiveBlock(index)}
          >
            <div className="dark-block-header">
              <div className={cn("dark-block-type", getBlockTypeClass(block.data.type))}>
                {block.data.type.toUpperCase()}
              </div>
              <span className="dark-timestamp">
                {new Date(block.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="mb-3">
              <h4 className="text-white font-medium text-sm">{block.data.title}</h4>
              {block.data.action && <p className="text-gray-400 text-xs">{block.data.action}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Hash: </span>
                <code className="dark-hash">{formatHash(block.hash)}</code>
              </div>
              <div>
                <span className="text-gray-400">Previous: </span>
                <code className="dark-hash">
                  {block.previousHash ? formatHash(block.previousHash) : "Genesis"}
                </code>
              </div>
            </div>
            
            {activeBlock === index && (
              <div className="w-full h-1 bg-[rgba(80,252,149,0.6)] mt-3 animate-pulse-opacity"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockchainVisualizer;
