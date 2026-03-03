import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import GiftInventoryModal from './GiftInventoryModal';

interface GiftButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  onClick?: () => void;
  context?: 'live-stream' | 'default'; // Add context prop
}

const GiftButton: React.FC<GiftButtonProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'default',
  onClick,
  context = 'default'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-14 h-14';
      default: return 'w-12 h-12';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'bg-white/20 text-white hover:bg-white/30 border border-white/30';
      case 'ghost':
        return 'bg-white/10 text-white hover:bg-white/20';
      default:
        return 'bg-white/20 text-white hover:bg-white/30';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center gap-2 whitespace-nowrap 
          rounded-full transition-all duration-300 
          hover:scale-105 active:scale-95
          relative
          ${getSizeClasses()}
          ${getVariantClasses()}
          ${className}
        `}
        title="My Gift Inventory"
      >
        <Gift className={`${getIconSize()}`} />
        {variant === 'default' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      <GiftInventoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        context={context}
      />
    </>
  );
};

export default GiftButton;
