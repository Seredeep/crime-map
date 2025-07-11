import { createClient } from '@supabase/supabase-js';

// Para operaciones en el servidor (ej. rutas API)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Asegúrate de que las variables de entorno estén definidas
if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL no está definido. Las operaciones de Supabase en el servidor podrían fallar.');
}
if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY no está definido. Las operaciones de Supabase en el servidor podrían fallar.');
}

export const createSupabaseServerClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Faltan variables de entorno para inicializar Supabase Server Client.');
  }
  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false, // No persistir sesión en el servidor
        autoRefreshToken: false, // No refrescar token en el servidor
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-server', // Identificador para el cliente de servidor
        },
      },
    }
  );
};
