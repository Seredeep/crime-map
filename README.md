# 🗺️ Crime Map - Mapa de Incidentes

> Plataforma de visualización y reporte de incidentes de seguridad urbana en Argentina. Permite a los ciudadanos reportar, visualizar y analizar incidentes de forma colaborativa y verificada.

## ✨ Características

- 🗺️ **Mapa interactivo** con visualización en tiempo real
- 📱 **Responsive** - Optimizado para móvil y desktop
- 🔐 **Autenticación** con Google y credenciales
- 📊 **Estadísticas** y análisis temporal/geográfico
- 🏷️ **Sistema de tags** y filtros avanzados
- 🖼️ **Subida de evidencias** con Supabase Storage
- 👥 **Roles de usuario** (Usuario, Editor, Admin)

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ o Bun
- MongoDB (local o Atlas)
- Cuenta de Supabase
- Google Maps API Key

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd crime-map

# Instalar dependencias
bun install
# o
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
bun dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ⚙️ Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
# Base de datos
MONGODB_URI=mongodb://localhost:27017/crime-map
# o MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/crime-map

# Autenticación
NEXTAUTH_SECRET=tu-secret-super-seguro
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Google Maps
GOOGLE_MAPS_API_KEY=tu-google-maps-api-key

# Supabase (para almacenamiento de archivos)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-supabase-service-key

# Geocoding alternativo
MAPS_CO_API_KEY=tu-maps-co-api-key
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas API
│   ├── auth/              # Páginas de autenticación
│   ├── admin/             # Panel de administración
│   └── components/        # Componentes React
├── lib/                   # Utilidades y servicios
│   ├── config/           # Configuración (roles, etc.)
│   └── hooks/            # Custom hooks
├── constants/            # Constantes del proyecto
└── scripts/              # Scripts de utilidad/migración
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo Web
bun dev                    # Servidor de desarrollo web
npm run dev               # Alternativa con npm

# Desarrollo Móvil (Capacitor)
npm run dev:android:robust # Hot reload en Android (RECOMENDADO)
npm run dev:android:simple # Hot reload simple
npm run dev:android:advanced # Con instrucciones detalladas

# Solución de Problemas
npm run fix-gradle-issue   # Solución completa para errores de Gradle
npm run clean:android      # Limpieza de Android
npm run cap:restore        # Restaurar configuración

# Producción
bun build                  # Build de producción web
npm run build:prod         # Build de producción móvil

# Utilidades
bun lint                   # Linter ESLint
bun run load-neighborhoods # Cargar datos de barrios
bun run import-incidents   # Importar incidentes (desarrollo)
```

## 📱 Desarrollo Móvil

Para desarrollo con hot reload en Android:

1. **Iniciar:** `npm run dev:android:robust`
2. **Seguir instrucciones** que aparecen en pantalla
3. **Desarrollar** con hot reload automático
4. **Finalizar:** `npm run cap:restore`

📚 **Documentación completa:** [docs/CAPACITOR/README.md](docs/CAPACITOR/README.md)

## 🗃️ Base de Datos

### Configuración inicial

1. **MongoDB**: Crea una base de datos llamada `crime-map`
2. **Colecciones principales**:
   - `incidents` - Incidentes reportados
   - `users` - Usuarios del sistema
   - `neighborhoods` - Datos geográficos de barrios

3. **Cargar datos iniciales**:
```bash
# Cargar barrios (requiere archivo GeoJSON)
cd scripts && node load-neighborhoods-local.js
```

### Supabase Storage
1. Crea un proyecto en [Supabase](https://supabase.com)
2. El bucket `incident-evidence` se crea automáticamente
3. Configura las policies de acceso según necesites

## 🔐 Roles y Permisos

- **Usuario**: Puede reportar y ver incidentes
- **Editor**: Puede verificar/editar incidentes
- **Admin**: Gestión completa de usuarios e incidentes

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- 📧 Email: [tu-email@ejemplo.com]
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 📖 Docs: [Ver documentación completa](link-to-docs)
