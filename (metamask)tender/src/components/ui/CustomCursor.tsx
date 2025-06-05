import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);

  useEffect(() => {
    const addPoint = ({ x, y }: { x: number, y: number }) => {
      const newTrail = [...trail, { x, y, id: Date.now() }];
      if (newTrail.length > 20) {
        newTrail.shift();
      }
      setTrail(newTrail);
    };

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      addPoint({ x: e.clientX, y: e.clientY });
    };

    const handleLinkHoverIn = () => setLinkHovered(true);
    const handleLinkHoverOut = () => setLinkHovered(false);
    
    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    const linkElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
    linkElements.forEach(el => {
      el.addEventListener('mouseenter', handleLinkHoverIn);
      el.addEventListener('mouseleave', handleLinkHoverOut);
    });

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);

      linkElements.forEach(el => {
        el.removeEventListener('mouseenter', handleLinkHoverIn);
        el.removeEventListener('mouseleave', handleLinkHoverOut);
      });
    };
  }, [trail]);

  // Remove trail points that are older than 200ms
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prevTrail => prevTrail.slice(Math.max(prevTrail.length - 5, 0)));
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  if (typeof window === 'undefined') return null;
  
  return (
    <>
      <div 
        className={cn(
          "cursor-dot", 
          clicked && "scale-150 opacity-80",
          hidden && "opacity-0",
          linkHovered && "scale-150 opacity-100"
        )}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          backgroundColor: linkHovered ? '#4ADE80' : clicked ? '#3B82F6' : '#4ADE80'
        }}
      />
      
      <div 
        className={cn(
          "cursor-outline",
          clicked && "w-6 h-6 border-blue-500",
          hidden && "opacity-0",
          linkHovered && "w-7 h-7 border-green-500 opacity-70"
        )}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px` 
        }}
      />

      {trail.map((point, index) => (
        <div
          key={point.id}
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            opacity: 0.2 - index * 0.01,
            transform: `scale(${0.5 - index * 0.02})`,
            backgroundColor: '#4ADE80',
            position: 'fixed',
            borderRadius: '50%',
            width: '4px',
            height: '4px',
            zIndex: 9990,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
};

export default CustomCursor;
