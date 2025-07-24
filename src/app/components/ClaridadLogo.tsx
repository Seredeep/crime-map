'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ClaridadLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
  xl: 'h-16 w-16',
  '2xl': 'h-20 w-20',
  '3xl': 'h-24 w-24'
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
  '3xl': 'text-4xl'
};

export default function ClaridadLogo({
  size = 'md',
  showText = true,
  className = '',
  animated = false
}: ClaridadLogoProps) {
  const LogoComponent = (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {animated ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src="/icons/clari.svg"
              alt="Claridad Logo"
              width={100}
              height={100}
              quality={100}
              className={`${sizeClasses[size]} object-contain`}
            />
          </motion.div>
        ) : (
          <Image
            src="/icons/clari.svg"
            alt="Claridad Logo"
            width={100}
            height={100}
            quality={100}
            className={`${sizeClasses[size]} object-contain`}
          />
        )}
      </div>

      {showText && (
        <span className={`text-lg font-extrabold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent ${textSizes[size]}`}>
          Claridad
        </span>
      )}
    </div>
  );

  return LogoComponent;
}
