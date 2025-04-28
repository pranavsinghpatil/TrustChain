
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

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'tender':
        return 'bg-blockchain-purple text-white';
      case 'bid':
        return 'bg-blockchain-blue text-white';
      case 'award':
        return 'bg-blockchain-green text-white';
      case 'dispute':
        return 'bg-blockchain-red text-white';
      default:
        return 'bg-blockchain-gray text-white';
    }
  };
  
  const formatHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-100 p-6", className)}>
      <h3 className="text-lg font-medium mb-4">Blockchain Ledger</h3>
      <p className="text-sm text-gray-500 mb-4">
        Immutable record of all tender activities secured by blockchain technology
      </p>
      
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={cn(
              "border rounded-lg p-4 transition-all",
              activeBlock === index ? "border-blockchain-purple shadow-md" : "border-gray-200"
            )}
            onClick={() => setActiveBlock(index)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className={cn("px-3 py-1 rounded-full text-xs", getBlockTypeColor(block.data.type))}>
                {block.data.type.toUpperCase()}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(block.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="mb-3">
              <h4 className="font-medium text-sm">{block.data.title}</h4>
              {block.data.action && <p className="text-xs text-gray-600">{block.data.action}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Hash: </span>
                <code className="bg-gray-100 px-1 py-0.5 rounded">{formatHash(block.hash)}</code>
              </div>
              <div>
                <span className="text-gray-500">Previous: </span>
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  {block.previousHash ? formatHash(block.previousHash) : "Genesis"}
                </code>
              </div>
            </div>
            
            {activeBlock === index && (
              <div className="w-full h-1 bg-blockchain-purple mt-3 animate-pulse-opacity"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockchainVisualizer;
