'use client';

import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';

interface FloatingReportButtonProps {
  onClick: () => void;
  isVisible?: boolean;
  className?: string;
}

const FloatingReportButton = ({ onClick, isVisible = true, className }: FloatingReportButtonProps) => {
  // Minimal UI: no tooltip

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      className={`fixed bottom-[30%] right-4 z-[130] md:hidden ${className}`}
    >
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg"
      >
        <FiPlus className="w-8 h-8" />
      </motion.button>
    </motion.div>
  );
};

export default FloatingReportButton;
