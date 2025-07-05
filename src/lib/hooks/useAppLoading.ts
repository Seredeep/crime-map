'use client';

import { useEffect, useState } from 'react';

const loadingSteps = [
  { progress: 10, message: 'Iniciando Claridad...' },
  { progress: 25, message: 'Conectando con la comunidad...' },
  { progress: 40, message: 'Cargando tus chats...' },
  { progress: 55, message: 'Sincronizando mensajes...' },
  { progress: 70, message: 'Verificando notificaciones...' },
  { progress: 85, message: 'Preparando alertas de pánico...' },
  { progress: 100, message: 'Listo para chatear con tus vecinos' },
];

export function useAppLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(loadingSteps[0].message);

  useEffect(() => {
    let current = 0;
    function nextStep() {
      if (current < loadingSteps.length) {
        setProgress(loadingSteps[current].progress);
        setMessage(loadingSteps[current].message);
        current++;
        setTimeout(nextStep, 350 + Math.random() * 250);
      } else {
        setTimeout(() => setIsLoading(false), 500);
      }
    }
    nextStep();
  }, []);

  const finishLoading = () => {
    setIsLoading(false);
    setProgress(100);
    setMessage('Listo!');
  };

  return {
    isLoading,
    progress,
    message,
    finishLoading
  };
}
