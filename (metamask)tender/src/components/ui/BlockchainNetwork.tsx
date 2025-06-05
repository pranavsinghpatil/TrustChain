import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Link2, Server, HardDrive, Zap, Network } from 'lucide-react';

interface Node {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  type: 'node' | 'miner' | 'wallet' | 'contract';
  connections: number[];
  pulse: number;
}

const BlockchainNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const nodesRef = useRef<Node[]>([]);
  const animationFrameId = useRef<number>();
  const lastTime = useRef<number>(0);
  const hoveredNode = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Node types with different colors and roles
    const nodeTypes = [
      { type: 'node', color: '#3B82F6', icon: <Server size={12} /> },
      { type: 'miner', color: '#10B981', icon: <Cpu size={12} /> },
      { type: 'wallet', color: '#8B5CF6', icon: <HardDrive size={12} /> },
      { type: 'contract', color: '#EC4899', icon: <FileText size={12} /> }
    ];

    // Create nodes
    const createNodes = () => {
      const nodes: Node[] = [];
      const numNodes = 18;
      const { width, height } = canvas.getBoundingClientRect();
      
      for (let i = 0; i < numNodes; i++) {
        const typeIndex = Math.floor(Math.random() * nodeTypes.length);
        const nodeType = nodeTypes[typeIndex];
        
        nodes.push({
          x: Math.random() * (width - 40) + 20,
          y: Math.random() * (height - 40) + 20,
          size: 8 + Math.random() * 4,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          color: nodeType.color,
          type: nodeType.type as Node['type'],
          connections: [],
          pulse: Math.random() * 2 * Math.PI
        });
      }
      
      // Create some connections
      nodes.forEach((node, i) => {
        const numConnections = 2 + Math.floor(Math.random() * 3);
        while (node.connections.length < numConnections) {
          const target = Math.floor(Math.random() * nodes.length);
          if (target !== i && !node.connections.includes(target)) {
            node.connections.push(target);
          }
        }
      });
      
      return nodes;
    };

    // Initialize nodes
    nodesRef.current = createNodes();

    // Draw function
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      
      // Draw connections first (behind nodes)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1.5;
      
      nodesRef.current.forEach((node, i) => {
        node.connections.forEach(connIndex => {
          const targetNode = nodesRef.current[connIndex];
          if (targetNode) {
            // Only draw connection if it's not already drawn in the other direction
            if (i < connIndex || !targetNode.connections.includes(i)) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(targetNode.x, targetNode.y);
              ctx.stroke();
              
              // Add a subtle glow
              if (isHovered && (i === hoveredNode.current || connIndex === hoveredNode.current)) {
                ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
                ctx.lineWidth = 1.5;
              }
            }
          }
        });
      });
      
      // Draw nodes
      nodesRef.current.forEach((node, i) => {
        // Node glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * 2.5
        );
        gradient.addColorStop(0, `${node.color}80`);
        gradient.addColorStop(1, `${node.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Node
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        const innerGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size
        );
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = innerGradient;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        // Pulse effect
        if (Math.random() > 0.98) {
          node.pulse = 0;
        }
        
        if (node.pulse < node.size * 4) {
          node.pulse += 0.5;
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + node.pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      
      // Draw hover effect
      if (hoveredNode.current !== null) {
        const node = nodesRef.current[hoveredNode.current];
        if (node) {
          // Highlight connections
          node.connections.forEach(connIndex => {
            const targetNode = nodesRef.current[connIndex];
            if (targetNode) {
              ctx.strokeStyle = node.color;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(targetNode.x, targetNode.y);
              ctx.stroke();
              
              // Draw arrow head
              const angle = Math.atan2(targetNode.y - node.y, targetNode.x - node.x);
              ctx.beginPath();
              ctx.moveTo(targetNode.x, targetNode.y);
              ctx.lineTo(
                targetNode.x - 10 * Math.cos(angle - Math.PI / 6),
                targetNode.y - 10 * Math.sin(angle - Math.PI / 6)
              );
              ctx.lineTo(
                targetNode.x - 10 * Math.cos(angle + Math.PI / 6),
                targetNode.y - 10 * Math.sin(angle + Math.PI / 6)
              );
              ctx.closePath();
              ctx.fillStyle = node.color;
              ctx.fill();
            }
          });
          
          // Highlight node
          ctx.fillStyle = `${node.color}40`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Animation loop
    const animate = (timestamp: number) => {
      if (!lastTime.current) lastTime.current = timestamp;
      const deltaTime = timestamp - lastTime.current;
      lastTime.current = timestamp;
      
      const { width, height } = canvas.getBoundingClientRect();
      
      // Update node positions
      nodesRef.current.forEach((node, i) => {
        // Move node
        node.x += node.speedX;
        node.y += node.speedY;
        
        // Bounce off edges
        if (node.x < node.size || node.x > width - node.size) {
          node.speedX *= -1;
          node.x = Math.max(node.size, Math.min(width - node.size, node.x));
        }
        if (node.y < node.size || node.y > height - node.size) {
          node.speedY *= -1;
          node.y = Math.max(node.size, Math.min(height - node.size, node.y));
        }
        
        // Add some organic movement
        if (Math.random() > 0.98) {
          node.speedX += (Math.random() - 0.5) * 0.1;
          node.speedY += (Math.random() - 0.5) * 0.1;
          
          // Limit speed
          const speed = Math.sqrt(node.speedX * node.speedX + node.speedY * node.speedY);
          const maxSpeed = 0.8;
          if (speed > maxSpeed) {
            node.speedX = (node.speedX / speed) * maxSpeed;
            node.speedY = (node.speedY / speed) * maxSpeed;
          }
        }
      });
      
      draw();
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Handle mouse move for hover effects
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Find closest node
      let closestNode: number | null = null;
      let closestDist = 50; // Max distance to consider
      
      nodesRef.current.forEach((node, i) => {
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist && dist < node.size * 3) {
          closestDist = dist;
          closestNode = i;
        }
      });
      
      if (closestNode !== hoveredNode.current) {
        hoveredNode.current = closestNode;
        // Redraw to update hover effects
        draw();
      }
    };
    
    // Start animation
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', () => setIsHovered(true));
    canvas.addEventListener('mouseleave', () => {
      setIsHovered(false);
      hoveredNode.current = null;
    });
    
    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', () => setIsHovered(true));
      canvas.removeEventListener('mouseleave', () => {
        setIsHovered(false);
        hoveredNode.current = null;
      });
    };
  }, [isHovered]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-90"
        style={{
          background: 'radial-gradient(circle at center, rgba(17, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.95) 100%)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center p-4 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="flex items-center justify-center mb-2">
            <Network className="h-6 w-6 text-blue-400 mr-2" />
            <h3 className="text-lg font-medium text-white">Decentralized Network</h3>
          </div>
          <p className="text-sm text-gray-300 max-w-md">
            Securely connected to the blockchain network with real-time transaction processing
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainNetwork;
