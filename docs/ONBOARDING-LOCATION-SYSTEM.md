# Sistema de Onboarding con Ubicación

## Descripción

El sistema de onboarding ha sido actualizado para incluir información de ubicación jerárquica: País → Ciudad → Barrio. Esto permite una mejor organización de los usuarios y facilita la expansión a múltiples ciudades y países.

## Estructura de Datos

### Campos de Usuario en MongoDB

```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  surname: String,
  blockNumber: String,      // Opcional
  lotNumber: String,        // Opcional
  country: String,          // Nuevo: País (ej: "USA")
  city: String,            // Nuevo: Ciudad (ej: "San Francisco")
  neighborhood: String,     // Barrio seleccionado
  onboarded: Boolean,
  isOnboarded: Boolean,
  chatId: String,          // ID del chat del barrio
  updatedAt: Date
}
```

### Campos de Barrios en MongoDB

```javascript
{
  _id: ObjectId,
  type: "Feature",
  geometry: {
    type: "MultiPolygon",
    coordinates: [[[[]]]]
  },
  properties: {
    id: Number,
    name: String,           // Nombre del barrio (San Francisco)
    link: String,
    city: String,          // Ciudad (ej: "San Francisco")
    state: String,         // Estado (ej: "CA")
    country: String,       // País (ej: "USA")
    source: String,        // Fuente de datos
    // Campos de compatibilidad con Mar del Plata
    soc_fomen: String
  }
}
```

## Flujo de Onboarding

### 1. Selección Jerárquica

El usuario debe completar el onboarding en este orden:

1. **País**: Selecciona el país (actualmente solo "USA")
2. **Ciudad**: Selecciona la ciudad (actualmente solo "San Francisco")
3. **Barrio**: Selecciona el barrio específico de la ciudad

### 2. Validaciones

- No se puede seleccionar ciudad sin haber seleccionado país
- No se puede seleccionar barrio sin haber seleccionado ciudad
- Todos los campos de ubicación son obligatorios

### 3. Asignación de Chat

- Cada barrio tiene su propio chat en Firestore
- El usuario es automáticamente asignado al chat de su barrio
- Si el chat no existe, se crea automáticamente

## Scripts de Mantenimiento

### Actualizar Usuarios Existentes

```bash
# Actualizar todos los usuarios con información de ubicación
node scripts/update-users-location.js

# Solo mostrar estadísticas
node scripts/update-users-location.js --stats
```

### Cargar Barrios de San Francisco

```bash
# Cargar barrios desde la API de datos abiertos
node scripts/load-san-francisco-neighborhoods.js
```

## API Endpoints

### GET /api/neighborhoods

Obtiene todos los barrios disponibles.

**Parámetros opcionales:**
- `city`: Filtrar por ciudad
- `country`: Filtrar por país

**Ejemplo:**
```bash
GET /api/neighborhoods?city=San Francisco&country=USA
```

### POST /api/user/onboarding

Completa el onboarding del usuario.

**Body:**
```json
{
  "name": "Juan",
  "surname": "Pérez",
  "blockNumber": "123",
  "lotNumber": "456",
  "country": "USA",
  "city": "San Francisco",
  "neighborhood": "Mission District"
}
```

## Compatibilidad

### Usuarios Existentes

- Los usuarios existentes han sido actualizados automáticamente
- Se les asignó "USA" como país y "San Francisco" como ciudad
- Mantienen su barrio original si lo tenían

### Barrios de Mar del Plata

- Los scripts de Mar del Plata están comentados
- La estructura de datos mantiene compatibilidad con `soc_fomen`
- Se puede volver a Mar del Plata fácilmente descomentando los scripts

## Expansión Futura

### Agregar Nuevas Ciudades

1. Cargar los barrios de la nueva ciudad usando el script correspondiente
2. Los barrios deben incluir `country` y `city` en sus propiedades
3. El onboarding automáticamente mostrará las nuevas opciones

### Agregar Nuevos Países

1. Cargar barrios del nuevo país
2. Asegurar que tengan `country` y `city` en sus propiedades
3. El sistema automáticamente detectará y mostrará las nuevas opciones

## Estadísticas Actuales

- **Total de usuarios**: 30
- **Usuarios con país**: 30 (100%)
- **Usuarios con ciudad**: 30 (100%)
- **Usuarios con barrio**: 11 (37%)
- **Usuarios con onboarding**: 11 (37%)

### Distribución por País
- USA: 30 usuarios

### Distribución por Ciudad
- San Francisco: 30 usuarios

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'localeCompare')"

**Causa**: El código intenta acceder a `soc_fomen` que no existe en barrios de San Francisco.

**Solución**: Usar la nueva estructura que maneja tanto `name` como `soc_fomen`.

### Usuarios sin información de ubicación

**Causa**: Usuarios creados antes de la actualización.

**Solución**: Ejecutar `node scripts/update-users-location.js`

### Barrios no aparecen en el onboarding

**Causa**: Los barrios no tienen `country` o `city` en sus propiedades.

**Solución**: Verificar que los barrios tengan los campos correctos en MongoDB.
