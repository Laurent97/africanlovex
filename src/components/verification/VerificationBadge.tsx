import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Crown } from 'lucide-react';
import { VerificationBadgeProps, BADGE_CONFIGS } from '@/types/verification';

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  level, 
  size = 'md',
  showTooltip = true,
  animated = true,
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const tooltipSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm'
  };

  const badge = BADGE_CONFIGS[level];
  const IconComponent = level === 'basic' ? CheckCircle : level === 'premium' ? Star : Crown;

  const badgeVariants = {
    basic: animated ? 'pulse' : '',
    premium: animated ? 'pulse-glow' : '',
    golden: animated ? 'shimmer' : ''
  };

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        className={`relative inline-flex items-center justify-center ${badge.bg} rounded-full p-1 shadow-md`}
      >
        <div className={`${badge.color}`}>
          <IconComponent className={sizes[size]} />
        </div>
        
        {/* Animated effects */}
        {animated && level === 'premium' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-400 opacity-30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {animated && level === 'golden' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 opacity-20"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          <span className={tooltipSizes[size]}>{badge.label}</span>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationBadge;
