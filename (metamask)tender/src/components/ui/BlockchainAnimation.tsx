import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Lock, FileCheck, Cpu, Zap } from 'lucide-react';

const BlockchainAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation variants
  const blockVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: i * 0.2 + 0.1,
        duration: 0.8,
        ease: "easeInOut"
      }
    })
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.2 + 0.3,
        duration: 0.4,
        type: "spring",
        stiffness: 200
      }
    })
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Block data
  const blocks = [
    { id: 1, icon: <Database size={20} />, color: "from-blue-500 to-blue-600" },
    { id: 2, icon: <Shield size={20} />, color: "from-green-500 to-green-600" },
    { id: 3, icon: <Lock size={20} />, color: "from-purple-500 to-purple-600" },
    { id: 4, icon: <FileCheck size={20} />, color: "from-amber-500 to-amber-600" },
    { id: 5, icon: <Cpu size={20} />, color: "from-red-500 to-red-600" }
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center" ref={containerRef}>
      <div className="relative w-full max-w-md">
        {/* Animated blockchain */}
        <div className="relative flex flex-col items-center">
          <svg
            width="100%"
            height="350"
            viewBox="0 0 320 350"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-0 left-0 w-full h-full"
          >
            {/* Connection lines */}
            <motion.path
              d="M160 50 L160 90"
              stroke="url(#gradientLine1)"
              strokeWidth="2"
              strokeDasharray="1 3"
              initial="hidden"
              animate="visible"
              custom={0}
              variants={lineVariants}
            />
            <motion.path
              d="M160 130 L160 170"
              stroke="url(#gradientLine2)"
              strokeWidth="2"
              strokeDasharray="1 3"
              initial="hidden"
              animate="visible"
              custom={1}
              variants={lineVariants}
            />
            <motion.path
              d="M160 210 L160 250"
              stroke="url(#gradientLine3)"
              strokeWidth="2"
              strokeDasharray="1 3"
              initial="hidden"
              animate="visible"
              custom={2}
              variants={lineVariants}
            />
            <motion.path
              d="M160 290 L160 330"
              stroke="url(#gradientLine4)"
              strokeWidth="2"
              strokeDasharray="1 3"
              initial="hidden"
              animate="visible"
              custom={3}
              variants={lineVariants}
            />

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="gradientLine1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="gradientLine2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="gradientLine3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="gradientLine4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Blockchain blocks */}
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              className="relative mb-10 z-10"
              initial="hidden"
              animate="visible"
              custom={index}
              variants={blockVariants}
            >
              <motion.div
                className={`w-28 h-28 rounded-xl bg-gradient-to-br ${block.color} p-0.5 shadow-lg backdrop-blur-sm`}
                variants={pulseVariants}
                animate="pulse"
              >
                <div className="w-full h-full rounded-xl bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <div className="w-full flex justify-between items-center mb-2">
                    <div className="text-xs text-white/70 font-mono">#{block.id}</div>
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                    </div>
                  </div>
                  
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white mb-2"
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    variants={iconVariants}
                  >
                    {block.icon}
                  </motion.div>
                  
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${block.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: index * 0.2 + 0.4, duration: 0.7 }}
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Pulse effect */}
              <div className="absolute inset-0 -z-10">
                <div className={`absolute inset-0 bg-gradient-to-br ${block.color} rounded-xl opacity-30 blur-xl`} />
              </div>
            </motion.div>
          ))}

          {/* Energy particles */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <Zap size={32} className="text-yellow-400 opacity-30" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAnimation;
