import { useTranslations } from 'next-intl';
import React from 'react';

interface CustomLoaderProps {
  loadingText?: string;
  words?: string[];
  className?: string;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({
  loadingText,
  words,
  className = ""
}) => {
  const t = useTranslations('Loader');

  // Usar traducciones como valores por defecto, pero permitir override con props
  const finalLoadingText = loadingText || t('loading');
  const finalWords = words || t('words');
  // Asegurar que tenemos al menos 5 palabras para la animación
  const animationWords = [...finalWords];
  while (animationWords.length < 5) {
    animationWords.push(...finalWords);
  }
  const displayWords = animationWords.slice(0, 5);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="bg-black p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center text-gray-300 font-medium text-xl font-poppins h-10 px-3">
          <span className="mr-2">{finalLoadingText}</span>
          <div className="relative overflow-hidden h-full">
            {/* Gradiente para suavizar el clip */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none"></div>

            <div className="pl-1.5">
              {displayWords.map((word, index) => (
                <span
                  key={index}
                  className="block h-full text-white animate-word-cycle"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLoader;
