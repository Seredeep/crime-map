'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import PanicButton from './PanicButton';

const GlobalPanicButton = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // El botón de pánico ahora será visible en todas las rutas.
  // Ajustaremos su posición para que coexista con el botón de reporte en la página principal.

  // No mostrar el botón si no está autenticado
  const shouldHideButton = status !== 'authenticated' || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding');

  if (shouldHideButton) {
    return null;
  }

  return (
    // Posicionamos el botón de pánico. En la página principal (mapa), estará encima del botón de reportar.
    // En otras páginas, aparecerá en la posición por defecto (bottom-36).
    <PanicButton className={`${pathname === '/' ? 'bottom-48' : 'bottom-36'}`} />
  );
};

export default GlobalPanicButton;
