'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

export function useAppLoading() {
  const t = useTranslations('AppLoading');

  const loadingSteps = useMemo(() => [
    { progress: 10, message: t('startingClaridad') },
    { progress: 25, message: t('connectingCommunity') },
    { progress: 40, message: t('loadingChats') },
    { progress: 55, message: t('syncingMessages') },
    { progress: 70, message: t('checkingNotifications') },
    { progress: 85, message: t('preparingPanicAlerts') },
    { progress: 100, message: t('readyToChat') },
  ], [t]);
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
  }, [loadingSteps]);

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
