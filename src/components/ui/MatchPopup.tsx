import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: {
    name: string;
    age: number;
    avatar: string;
  };
  onStartChat?: () => void;
  onKeepSwiping?: () => void;
}

const MatchPopup: React.FC<MatchPopupProps> = ({
  isOpen,
  onClose,
  matchedUser,
  onStartChat,
  onKeepSwiping
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center"
          style={{ 
            borderRadius: '24px 24px 12px 24px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F7F4 100%)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #B11D2D 0%, #5E2A6B 100%)'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Heart className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>

          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  rotate: Math.random() * 360,
                  scale: 0
                }}
                animate={{ 
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  rotate: Math.random() * 360,
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#B11D2D', '#CFAF4E', '#2C5F2D', '#1A5F8A', '#5E2A6B'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>

          {/* Match Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ 
              fontFamily: "'Playfair Display', serif",
              color: '#26231F'
            }}>
              It's a Match! 🎉
            </h2>
            <p className="text-sm mb-6" style={{ color: '#5E5950' }}>
              You and {matchedUser.name} liked each other!
            </p>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <Avatar className="w-16 h-16">
              <AvatarImage src={matchedUser.avatar} />
              <AvatarFallback>{matchedUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <h3 className="font-semibold text-lg" style={{ color: '#26231F' }}>
                {matchedUser.name}
              </h3>
              <p className="text-sm" style={{ color: '#7E786E' }}>
                Age {matchedUser.age}
              </p>
            </div>
            <Avatar className="w-16 h-16">
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <Button
              onClick={onStartChat}
              className="flex-1"
              style={{ 
                background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                color: 'white',
                border: 'none'
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button
              onClick={onKeepSwiping}
              variant="outline"
              className="flex-1"
              style={{ borderColor: '#E5E0D8' }}
            >
              Keep Swiping
            </Button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-center"
            style={{ color: '#A69F94' }}
          >
            <p>Start a conversation to get to know each other better!</p>
            <p className="mt-1">Good luck on your dating journey! 💕</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MatchPopup;
