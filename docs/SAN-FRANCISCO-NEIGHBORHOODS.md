# Barrios de San Francisco - Integración

## Descripción

Este documento describe la integración de los barrios de San Francisco en el sistema de Crime Map, reemplazando temporalmente los barrios de Mar del Plata para esta rama de desarrollo.

## Fuente de Datos

Los barrios de San Francisco se obtienen de la API de datos abiertos de la ciudad de San Francisco:
- **URL**: https://data.sfgov.org/resource/gfpk-269f.json
- **Formato**: GeoJSON
- **Total de barrios**: 117
- **Cobertura**: Toda la ciudad de San Francisco, CA

## Archivos Modificados

### Scripts de Carga

1. **`scripts/load-san-francisco-neighborhoods.js`** (NUEVO)
   - Descarga los barrios desde la API de SF
   - Convierte el formato a GeoJSON estándar
   - Carga los datos en MongoDB

2. **`scripts/load-neighborhoods-fetch.js`** (COMENTADO)
   - Script original para Mar del Plata comentado
   - No se ejecuta en esta rama

3. **`scripts/load-neighborhoods-local.js`** (COMENTADO)
   - Script original para Mar del Plata comentado
   - No se ejecuta en esta rama

### Servicios

4. **`src/lib/services/neighborhoods/neighborhoodService.ts`**
   - Actualizada la interfaz `Neighborhood` para soportar ambos formatos
   - Agregadas funciones para filtrar por ciudad
   - Nueva función `fetchSanFranciscoNeighborhoods()`

5. **`src/lib/services/neighborhoods/index.ts`**
   - Exportaciones actualizadas con las nuevas funciones

### API

6. **`src/app/api/neighborhoods/route.ts`**
   - Agregado soporte para filtrar por ciudad
   - Parámetro de query `?city=San Francisco`

### Componentes

7. **`src/app/components/SanFranciscoNeighborhoods.tsx`** (NUEVO)
   - Componente de ejemplo para mostrar los barrios
   - Incluye búsqueda y filtrado
   - Interfaz responsive

8. **`src/app/sf-neighborhoods/page.tsx`** (NUEVO)
   - Página de prueba para mostrar los barrios
   - Accesible en `/sf-neighborhoods`

## Estructura de Datos

### Formato de San Francisco

```json
{
  "type": "Feature",
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [[[...]]]
  },
  "properties": {
    "id": 1,
    "name": "Seacliff",
    "link": "http://en.wikipedia.org/wiki/Sea_Cliff,_San_Francisco,_California",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "source": "SF Open Data"
  }
}
```

### Comparación con Mar del Plata

| Campo | San Francisco | Mar del Plata |
|-------|---------------|---------------|
| Nombre | `properties.name` | `properties.soc_fomen` |
| ID | `properties.id` | `properties.cartodb_id` |
| Ciudad | `properties.city` | No disponible |
| Estado | `properties.state` | No disponible |
| País | `properties.country` | No disponible |
| Enlace | `properties.link` | No disponible |

## Uso

### Cargar Barrios

```bash
node scripts/load-san-francisco-neighborhoods.js
```

### Usar en el Código

```typescript
import { fetchSanFranciscoNeighborhoods, searchNeighborhoodsByName } from '@/lib/services/neighborhoods';

// Obtener todos los barrios de SF
const neighborhoods = await fetchSanFranciscoNeighborhoods();

// Buscar barrios por nombre
const results = await searchNeighborhoodsByName('Mission');
```

### API Endpoints

- **Todos los barrios**: `GET /api/neighborhoods`
- **Barrios de SF**: `GET /api/neighborhoods?city=San Francisco`

## Página de Prueba

Visita `/sf-neighborhoods` para ver una demostración de los barrios cargados con:
- Lista completa de 117 barrios
- Búsqueda en tiempo real
- Información detallada de cada barrio
- Enlaces a Wikipedia (cuando estén disponibles)

## Revertir a Mar del Plata

Para volver a usar los barrios de Mar del Plata:

1. Descomenta los scripts originales
2. Ejecuta `node scripts/load-neighborhoods-fetch.js`
3. Actualiza la configuración de la ciudad en `src/lib/config/app.ts`

## Notas Técnicas

- Los datos se almacenan en la misma colección `neighborhoods` de MongoDB
- Se usa el campo `properties.city` para distinguir entre ciudades
- Los índices geoespaciales se mantienen para consultas de proximidad
- La interfaz es compatible con ambos formatos de datos
