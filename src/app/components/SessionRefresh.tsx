'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function SessionRefresh() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const hasChecked = useRef(false);
  const isChecking = useRef(false);

  useEffect(() => {
    const refreshSession = async () => {
      // Solo ejecutar una vez al cargar la página o si hay cambios específicos
      if (!session?.user?.email || hasChecked.current || isChecking.current) {
        return;
      }

      isChecking.current = true;

      try {
        const response = await fetch('/api/auth/refresh-session', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.user) {
            // Solo actualizar si hay diferencias importantes
            if (session.user.onboarded !== data.user.onboarded) {
              console.log('🔄 Actualizando sesión - onboarded:', data.user.onboarded);
              await update({
                onboarded: data.user.onboarded,
                enabled: data.user.enabled,
                role: data.user.role
              });

              // Recargar la página para aplicar el middleware correctamente
              setTimeout(() => {
                router.refresh();
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
      } finally {
        hasChecked.current = true;
        isChecking.current = false;
      }
    };

    // Solo ejecutar una vez cuando se monta el componente
    if (session && !hasChecked.current) {
      refreshSession();
    }
  }, [session, update, router]);

  return null;
}
