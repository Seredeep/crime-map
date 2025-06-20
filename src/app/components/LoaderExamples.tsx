import CustomLoader from './CustomLoader';

// Ejemplos de uso del CustomLoader para diferentes contextos

// Para carga de mapa
export const MapLoader = () => (
  <CustomLoader
    loadingText="cargando"
    words={["mapa", "ubicaciones", "coordenadas", "barrios", "zonas"]}
    className="h-64"
  />
);

// Para carga de incidentes
export const IncidentsLoader = () => (
  <CustomLoader
    loadingText="obteniendo"
    words={["incidentes", "reportes", "datos", "estadísticas", "información"]}
    className="h-32"
  />
);

// Para carga de estadísticas
export const StatsLoader = () => (
  <CustomLoader
    loadingText="calculando"
    words={["estadísticas", "gráficos", "tendencias", "análisis", "métricas"]}
    className="h-40"
  />
);

// Para carga de geocodificación
export const GeocodeLoader = () => (
  <CustomLoader
    loadingText="buscando"
    words={["dirección", "ubicación", "coordenadas", "lugar", "zona"]}
    className="h-24"
  />
);

// Para carga de usuario/autenticación
export const AuthLoader = () => (
  <CustomLoader
    loadingText="verificando"
    words={["usuario", "sesión", "permisos", "acceso", "datos"]}
    className="h-28"
  />
);

// Para carga de formularios
export const FormLoader = () => (
  <CustomLoader
    loadingText="guardando"
    words={["reporte", "datos", "información", "incidente", "formulario"]}
    className="h-24"
  />
);

// Para carga de barrios/comunidades
export const NeighborhoodsLoader = () => (
  <CustomLoader
    loadingText="cargando"
    words={["barrios", "comunidades", "zonas", "sectores", "áreas"]}
    className="h-32"
  />
);

// Loader genérico más pequeño para elementos inline
export const InlineLoader = ({ words }: { words?: string[] }) => (
  <CustomLoader
    loadingText=""
    words={words || ["cargando", "procesando", "obteniendo", "buscando", "verificando"]}
    className="h-8"
  />
);

// Loader de pantalla completa
export const FullScreenLoader = ({ words, loadingText }: {
  words?: string[],
  loadingText?: string
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <CustomLoader
      loadingText={loadingText || "cargando"}
      words={words || ["aplicación", "datos", "recursos", "contenido", "información"]}
      className="scale-125"
    />
  </div>
);

export default CustomLoader;
