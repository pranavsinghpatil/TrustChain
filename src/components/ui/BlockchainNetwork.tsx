import React, { useEffect, useRef } from 'react';

const BlockchainNetwork: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Make canvas responsive
      const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Nodes and connections
      const nodes: { x: number; y: number; size: number; speed: number; color: string }[] = [];
      const numNodes = 12;
      
      // Create nodes
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 3 + Math.random() * 5,
          speed: 0.2 + Math.random() * 0.5,
          color: i % 3 === 0 ? '#4ADE80' : i % 3 === 1 ? '#3B82F6' : '#8B5CF6'
        });
      }
      
      // Animation
      let animationFrameId: number;
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections between nodes
        ctx.lineWidth = 0.5;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              // Draw connection
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              
              // Gradient connection
              const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
              gradient.addColorStop(0, nodes[i].color + '60');
              gradient.addColorStop(1, nodes[j].color + '60');
              
              ctx.strokeStyle = gradient;
              ctx.stroke();
              
              // Animated data packets
              if (Math.random() < 0.01) {
                const packetX = nodes[i].x + (nodes[j].x - nodes[i].x) * (Math.random() * 0.8 + 0.1);
                const packetY = nodes[i].y + (nodes[j].y - nodes[i].y) * (Math.random() * 0.8 + 0.1);
                
                ctx.beginPath();
                ctx.arc(packetX, packetY, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
              }
            }
          }
        }
        
        // Draw nodes
        for (let i = 0; i < nodes.length; i++) {
          // Move nodes
          nodes[i].x += (Math.random() - 0.5) * nodes[i].speed;
          nodes[i].y += (Math.random() - 0.5) * nodes[i].speed;
          
          // Keep in bounds
          if (nodes[i].x < 0) nodes[i].x = 0;
          if (nodes[i].x > canvas.width) nodes[i].x = canvas.width;
          if (nodes[i].y < 0) nodes[i].y = 0;
          if (nodes[i].y > canvas.height) nodes[i].y = canvas.height;
          
          // Draw node
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, nodes[i].size, 0, Math.PI * 2);
          ctx.fillStyle = nodes[i].color;
          ctx.fill();
          
          // Draw glow
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, nodes[i].size + 2, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            nodes[i].x, nodes[i].y, nodes[i].size - 1,
            nodes[i].x, nodes[i].y, nodes[i].size + 4
          );
          gradient.addColorStop(0, nodes[i].color + '70');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
      };
    }, []);
    
    return (
      <div className="w-full h-full absolute top-0 left-0 z-0 opacity-20 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ filter: 'blur(1px)' }}
        />
      </div>
    );
  };
  
  export default BlockchainNetwork;