import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  title,
  maxHeight = '80vh'
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const sheetHeight = sheetRef.current?.offsetHeight || 0;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaY = currentY - startY;
      
      if (sheetRef.current && deltaY > 0) {
        const progress = deltaY / sheetHeight;
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        sheetRef.current.style.opacity = `${1 - progress * 0.5}`;
      }
    };

    const handleEnd = (endEvent: MouseEvent | TouchEvent) => {
      const endY = 'touches' in endEvent ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      const deltaY = endY - startY;
      
      if (sheetRef.current) {
        if (deltaY > sheetHeight * 0.3) {
          onClose();
        } else {
          sheetRef.current.style.transform = '';
          sheetRef.current.style.opacity = '';
        }
      }

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "max-h-[80vh] overflow-hidden",
          "pb-safe"
        )}
        style={{ maxHeight }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold">{title}</h2>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(80vh - 120px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
