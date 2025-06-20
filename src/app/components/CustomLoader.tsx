import React from 'react';

interface CustomLoaderProps {
  loadingText?: string;
  words?: string[];
  className?: string;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({
  loadingText = "cargando",
  words = ["datos", "mapas", "incidentes", "ubicaciones", "estadísticas"],
  className = ""
}) => {
  // Asegurar que tenemos al menos 5 palabras para la animación
  const animationWords = [...words];
  while (animationWords.length < 5) {
    animationWords.push(...words);
  }
  const displayWords = animationWords.slice(0, 5);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="bg-gray-900 dark:bg-gray-800 p-6 rounded-2xl">
        <div className="flex items-center text-gray-400 font-medium text-xl font-poppins h-10 px-3">
          <span className="mr-2">{loadingText}</span>
          <div className="relative overflow-hidden h-full">
            {/* Gradiente para suavizar el clip */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-transparent to-gray-900 dark:from-gray-800 dark:to-gray-800 z-10 pointer-events-none"></div>

            <div className="pl-1.5">
              {displayWords.map((word, index) => (
                <span
                  key={index}
                  className="block h-full text-purple-500 dark:text-purple-400 animate-word-cycle"
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
