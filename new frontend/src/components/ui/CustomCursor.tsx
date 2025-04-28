
import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      <div 
        className="custom-cursor fixed pointer-events-none z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Main cursor */}
        <div className={`
          relative rounded-full
          ${isPointer ? 'w-8 h-8' : 'w-6 h-6'}
          transition-all duration-200 ease-out
          bg-gradient-to-r from-blockchain-purple/30 to-blockchain-blue/30
          backdrop-blur-md
          border border-blockchain-purple/40
          ${isClicking ? 'scale-90' : 'scale-100'}
        `}>
          {/* Inner pulsing circle */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blockchain-purple/20 to-blockchain-blue/20 animate-pulse-opacity" />
          
          {/* Outer rotating hexagon */}
          <div className={`
            absolute -inset-2
            ${isPointer ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-200
          `}>
            <div className="w-full h-full animate-spin-slow">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blockchain-purple/30"
                  style={{
                    transform: `rotate(${i * 60}deg) translateY(-8px)`,
                    transformOrigin: '50% 50%'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Trailing dots */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blockchain-purple/30"
              style={{
                transform: `translate(${Math.cos(i * Math.PI / 1.5) * 12}px, ${Math.sin(i * Math.PI / 1.5) * 12}px)`,
                animation: `trail-fade ${0.5 + i * 0.2}s infinite alternate`
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default CustomCursor;
