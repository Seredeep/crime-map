# Configuración de Google Maps para el Chat

## 🎯 Descripción

Este documento explica cómo configurar Google Maps para que funcione correctamente el selector de ubicación en el chat.

## 🚨 Problema Identificado

El error `TypeError: can't access property "Wo", K is undefined` indica que Google Maps no se está inicializando correctamente, generalmente debido a:

1. **API Key faltante o inválida**
2. **Script de Google Maps no cargado**
3. **Librerías no disponibles**
4. **Problemas de timing en la carga**

## 🚀 Solución Paso a Paso

### 1. Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Maps JavaScript API** y **Places API**
4. Ve a **Credentials** → **Create Credentials** → **API Key**
5. Copia la API Key generada

### 2. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local` en la raíz del proyecto:

```bash
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

**⚠️ Importante:**
- La variable debe empezar con `NEXT_PUBLIC_` para ser accesible en el frontend
- No incluyas comillas alrededor de la API Key
- Reinicia el servidor de desarrollo después de agregar la variable

### 3. Verificar Configuración

Asegúrate de que tu API Key tenga acceso a:

- ✅ **Maps JavaScript API**
- ✅ **Places API** (para búsqueda de direcciones)
- ✅ **Geocoding API** (para convertir coordenadas a direcciones)

### 4. Restricciones de API Key (Opcional pero Recomendado)

En Google Cloud Console, puedes restringir tu API Key:

1. **Restricción de aplicaciones web**: Solo tu dominio
2. **Restricción de APIs**: Solo las APIs necesarias
3. **Cuotas**: Establecer límites de uso

## 🔧 Verificación de Funcionamiento

### 1. Verificar en el Navegador

Abre las **Developer Tools** (F12) y ve a la consola:

```javascript
// Verificar que Google Maps esté disponible
console.log('Google Maps disponible:', !!window.google);
console.log('Google Maps API:', !!window.google?.maps);
```

### 2. Verificar en el Componente

El componente ahora incluye logging mejorado:

```bash
# Éxito
✅ Google Maps inicializado correctamente

# Errores
❌ API key de Google Maps no configurada
❌ Error al cargar Google Maps
❌ Google Maps no está disponible
```

## 🛠️ Solución de Problemas

### Error: "API key de Google Maps no configurada"

**Causa**: Variable de entorno faltante
**Solución**:
```bash
# Agregar en .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### Error: "Google Maps no está disponible"

**Causa**: Script no cargado o API deshabilitada
**Solución**:
1. Verificar que la API esté habilitada en Google Cloud Console
2. Verificar que la API Key sea válida
3. Revisar la consola del navegador para errores de red

### Error: "Error al cargar Google Maps"

**Causa**: Problemas de timing o librerías faltantes
**Solución**:
1. Recargar la página
2. Verificar conexión a internet
3. Verificar que no haya bloqueadores de anuncios interfiriendo

## 📱 Uso en el Chat

### Seleccionar Ubicación

1. **Abrir selector**: Toca el botón de ubicación en el chat
2. **Buscar dirección**: Escribe una dirección en el campo de búsqueda
3. **Seleccionar en mapa**: Toca en el mapa para seleccionar coordenadas
4. **Confirmar**: Toca "Confirmar Ubicación"

### Funcionalidades Disponibles

- 🗺️ **Mapa interactivo** con zoom y pan
- 🔍 **Búsqueda de direcciones** con autocompletado
- 📍 **Marcadores** para ubicación seleccionada
- 🧭 **Ubicación actual** del usuario
- 📱 **Responsive** para dispositivos móviles

## 🔒 Seguridad

### Protección de API Key

- ✅ **Variable de entorno**: No hardcodeada en el código
- ✅ **Restricciones**: Configurables en Google Cloud Console
- ✅ **Cuotas**: Límites de uso configurables
- ✅ **Dominios**: Restricción por dominio de aplicación

### Límites Recomendados

```bash
# Cuotas sugeridas para desarrollo
Maps JavaScript API: 1000 requests/day
Places API: 1000 requests/day
Geocoding API: 1000 requests/day
```

## 📈 Monitoreo

### Google Cloud Console

- **APIs & Services** → **Dashboard**: Ver uso de APIs
- **APIs & Services** → **Credentials**: Gestionar API Keys
- **APIs & Services** → **Quotas**: Ver límites y uso

### Logs de la Aplicación

```bash
# Éxito
✅ Google Maps inicializado correctamente
✅ Ubicación seleccionada: {lat: X, lng: Y}

# Errores
❌ Error al cargar Google Maps
❌ Error obteniendo ubicación del usuario
```

## 🔗 Enlaces Útiles

- [Google Cloud Console](https://console.cloud.google.com/)
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

## 🎯 Próximos Pasos

1. **Configurar API Key** en variables de entorno
2. **Reiniciar servidor** de desarrollo
3. **Probar selector** de ubicación en el chat
4. **Verificar logs** en la consola del navegador
5. **Configurar restricciones** en Google Cloud Console (opcional)
