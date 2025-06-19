# 🏗️ Arquitectura del Proyecto - Crime Map

## 📋 Resumen

Crime Map es una aplicación web full-stack construida con Next.js 14 (App Router) que permite visualizar y reportar incidentes de seguridad urbana de forma colaborativa.

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Leaflet** - Mapas interactivos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Backend
- **Next.js API Routes** - API REST
- **NextAuth.js** - Autenticación
- **MongoDB** - Base de datos principal
- **Supabase Storage** - Almacenamiento de archivos

### Servicios Externos
- **Google Maps API** - Geocodificación
- **Maps.co API** - Geocodificación alternativa
- **Google OAuth** - Autenticación social

## 🏛️ Arquitectura de Capas

```
┌─────────────────────────────────────┐
│           PRESENTACIÓN              │
│  • Componentes React                │
│  • Páginas (App Router)             │
│  • Hooks personalizados             │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│            LÓGICA DE NEGOCIO        │
│  • Servicios (incidentService)      │
│  • Validaciones (Zod)               │
│  • Transformaciones de datos        │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│          ACCESO A DATOS             │
│  • MongoDB (incidents, users)       │
│  • Supabase (archivos)              │
│  • APIs externas (geocoding)        │
└─────────────────────────────────────┘
```

## 📁 Estructura de Directorios

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas API
│   │   ├── auth/          # Autenticación
│   │   ├── incidents/     # CRUD incidentes
│   │   ├── geocode/       # Servicios de geocoding
│   │   └── admin/         # Panel administrativo
│   ├── auth/              # Páginas de autenticación
│   ├── admin/             # Panel de administración
│   └── components/        # Componentes React
├── lib/                   # Utilidades y servicios
│   ├── config/           # Configuración (roles, etc.)
│   ├── hooks/            # Custom hooks
│   └── *.ts              # Servicios y utilidades
├── constants/            # Constantes del proyecto
└── middleware.ts         # Middleware de Next.js
```

## 🔐 Sistema de Autenticación

### Flujo de Autenticación
1. **Login** → NextAuth.js maneja OAuth/credenciales
2. **Session** → JWT almacenado en cookies seguras
3. **Middleware** → Protege rutas sensibles
4. **RBAC** → Control de acceso basado en roles

### Roles de Usuario
- **User**: Puede reportar y ver incidentes
- **Editor**: Puede verificar/editar incidentes
- **Admin**: Acceso completo al sistema

## 🗄️ Base de Datos

### Colecciones MongoDB

#### `incidents`
```javascript
{
  _id: ObjectId,
  type: String,           // robo, hurto, agresion, etc.
  description: String,
  location: {
    type: "Point",
    coordinates: [lng, lat]
  },
  address: String,
  severity: String,       // baja, media, alta, critica
  status: String,         // pendiente, verificado, rechazado
  tags: [String],
  images: [String],       // URLs de Supabase
  reportedBy: ObjectId,   // ref a users
  verifiedBy: ObjectId,   // ref a users (opcional)
  createdAt: Date,
  updatedAt: Date
}
```

#### `users`
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  image: String,
  role: String,           // user, editor, admin
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `neighborhoods`
```javascript
{
  _id: ObjectId,
  name: String,
  geometry: GeoJSON,      // Polígono del barrio
  properties: Object,     // Metadatos adicionales
  city: String,
  province: String
}
```

## 🗺️ Sistema de Mapas

### Componentes Principales
- **MapComponent**: Contenedor principal del mapa
- **IncidentMarkers**: Marcadores de incidentes
- **GeocodeSearch**: Búsqueda de direcciones
- **IncidentFilters**: Filtros de visualización

### Flujo de Datos del Mapa
1. **Carga inicial** → Obtener incidentes en viewport
2. **Filtros** → Aplicar filtros y recargar datos
3. **Interacción** → Click en marcador → Mostrar detalles
4. **Nuevo reporte** → Click en mapa → Abrir formulario

## 📱 Diseño Responsive

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Componentes Móviles
- **MobileBottomTabs**: Navegación inferior
- **MobileSlidePanel**: Panel deslizable
- **SwipeableIncidentsView**: Lista swipeable

## 🔄 Flujo de Datos

### Reporte de Incidente
```
Usuario → Formulario → Validación → Geocoding →
MongoDB → Notificación → Actualización UI
```

### Verificación de Incidente
```
Editor → Lista pendientes → Revisar → Aprobar/Rechazar →
Actualizar status → Notificar usuario
```

## 🚀 Optimizaciones

### Performance
- **Lazy Loading** de componentes pesados
- **Clustering** de marcadores en el mapa
- **Paginación** de incidentes
- **Caching** de datos geográficos

### SEO
- **Metadata** dinámico por página
- **Sitemap** generado automáticamente
- **Schema.org** para datos estructurados

## 🔧 Configuración de Desarrollo

### Variables de Entorno Críticas
- `MONGODB_URI`: Conexión a base de datos
- `NEXTAUTH_SECRET`: Secreto para JWT
- `GOOGLE_MAPS_API_KEY`: API de mapas
- `SUPABASE_*`: Configuración de almacenamiento

### Scripts de Desarrollo
- `bun dev`: Servidor de desarrollo
- `bun build`: Build de producción
- `node scripts/dev-utils.js`: Utilidades de desarrollo

## 📊 Monitoreo y Logs

### Métricas Importantes
- Tiempo de respuesta de APIs
- Errores de geocodificación
- Uso de almacenamiento (Supabase)
- Actividad de usuarios por rol

### Logging
- Errores de servidor → Console/archivo
- Eventos de usuario → Analytics
- Cambios críticos → Audit log

## 🔮 Futuras Mejoras

### Técnicas
- **Redis** para caching
- **WebSockets** para actualizaciones en tiempo real
- **PWA** para funcionalidad offline
- **Tests** automatizados (Jest + Cypress)

### Funcionales
- **Notificaciones push**
- **API pública** para terceros
- **Dashboard** de analytics
- **Machine Learning** para detección de patrones
