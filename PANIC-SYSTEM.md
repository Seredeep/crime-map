# Sistema de Botón de Pánico

## 📋 Descripción General

Sistema de alerta de pánico integrado en la aplicación de seguridad ciudadana que permite a los usuarios enviar alertas de emergencia a su barrio de manera rápida y discreta.

## 🎯 Características Principales

### ✅ **Botón Flotante**
- **Posición:** `bottom-36 right-4` (justo encima del FloatingReportButton)
- **Estilo:** Glassmorphism consistente con el diseño de la app
- **Tamaño:** `w-14 h-14` (ligeramente más pequeño que el botón de reporte)
- **Z-index:** `119` (para coexistir con otros elementos flotantes)

### ✅ **Estados Visuales**
1. **Normal:** Ícono de triángulo de alerta en naranja
2. **Confirmando:** Modal de confirmación con opciones
3. **Alertando:** Botón rojo pulsante con glow
4. **Éxito:** Ícono de check verde, luego vuelve al estado normal

### ✅ **Flujo de Interacción**
```
Click → Modal Confirmación → Envío API → Estado Alerta (5s) → Estado Éxito (2s) → Normal
```

## 🏗️ Arquitectura del Sistema

### Componente Principal
**Archivo:** `src/app/components/PanicButton.tsx`

```typescript
interface PanicButtonProps {
  isVisible?: boolean;
  className?: string;
}

type PanicState = 'normal' | 'confirming' | 'alerting' | 'success';
```

### API Endpoint
**Archivo:** `src/app/api/panic/send/route.ts`

**POST /api/panic/send**
- Requiere autenticación
- Guarda la alerta en MongoDB
- Registra información del usuario y ubicación
- Devuelve confirmación de envío

**GET /api/panic/send** (Opcional)
- Obtiene alertas activas del barrio
- Filtro por últimas 24 horas
- Limitado a 10 alertas más recientes

### Base de Datos
**Colección:** `panic_alerts`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userEmail: string,
  userName: string,
  neighborhood: string,
  chatId: string,
  blockNumber: number,
  lotNumber: number,
  timestamp: Date,
  location: string,
  status: 'active' | 'resolved',
  resolved: boolean,
  resolvedAt: Date,
  resolvedBy: string,
  createdAt: Date
}
```

## 🎨 Diseño Visual

### Estilo Glassmorphism
```css
background: rgba(255, 255, 255, 0.03)
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.08)
border-radius: 30px
```

### Estados de Color
- **Normal:** `text-orange-500`
- **Alertando:** `text-red-500` + fondo rojo translúcido
- **Éxito:** `text-green-500`

### Animaciones
- **Entrada:** Spring animation con delay
- **Hover:** Escala 1.02
- **Tap:** Escala 0.95
- **Alertando:** Pulse + escala respiratoria
- **Modal:** Fade in + slide up

## 🔄 Estados del Componente

### 1. Estado Normal
```typescript
panicState: 'normal'
```
- Ícono: `AlertTriangle` naranja
- Tooltip: "Botón de pánico" (se oculta después de 3s)
- Acción: Click → Estado confirming

### 2. Estado Confirmando
```typescript
panicState: 'confirming'
```
- Modal de confirmación con backdrop blur
- Opciones: "Cancelar" | "Sí, alertar"
- Cancelar → Estado normal
- Confirmar → Estado alerting + API call

### 3. Estado Alertando
```typescript
panicState: 'alerting'
```
- Duración: 5 segundos
- Visual: Botón rojo pulsante con glow
- Ícono: `AlertTriangle` rojo
- Auto-transición → Estado success

### 4. Estado Éxito
```typescript
panicState: 'success'
```
- Duración: 2 segundos
- Ícono: `CheckCircle` verde
- Auto-transición → Estado normal

## 📱 Integración

### En MobileCommunitiesView
```typescript
import PanicButton from './PanicButton';

// En el JSX
<PanicButton isVisible={true} />
```

### Coexistencia con FloatingReportButton
- **FloatingReportButton:** `bottom-52 right-4`
- **PanicButton:** `bottom-36 right-4`
- **Separación:** 16px entre botones
- **Z-index:** 120 vs 119 respectivamente

## 🛠️ API Reference

### POST /api/panic/send

**Request Body:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "location": "current"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Alerta de pánico enviada exitosamente",
  "data": {
    "alertId": "507f1f77bcf86cd799439011",
    "neighborhood": "Barrio 1",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "sent"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Error al enviar la alerta de pánico"
}
```

### GET /api/panic/send

**Response:**
```json
{
  "success": true,
  "message": "Alertas obtenidas exitosamente",
  "data": {
    "alerts": [
      {
        "id": "507f1f77bcf86cd799439011",
        "userName": "Juan Pérez",
        "neighborhood": "Barrio 1",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "location": "Manzana 15",
        "status": "active"
      }
    ]
  }
}
```

## 🔧 Personalización

### Cambiar Posición
```typescript
// En PanicButton.tsx
className="fixed bottom-36 right-4 z-[119] md:hidden"
```

### Modificar Duración de Estados
```typescript
// Estado alerting (5 segundos)
setTimeout(() => {
  setPanicState('success');
}, 5000);

// Estado success (2 segundos)
setTimeout(() => {
  setPanicState('normal');
}, 2000);
```

### Personalizar Colores
```typescript
const getButtonColor = () => {
  switch (panicState) {
    case 'alerting':
      return 'text-red-500';
    case 'success':
      return 'text-green-500';
    default:
      return 'text-orange-500'; // Cambiar color normal aquí
  }
};
```

## 🚀 Próximas Mejoras

### Funcionalidades Planeadas
- [ ] **Notificaciones Push:** Alertar a vecinos en tiempo real
- [ ] **Geolocalización:** Enviar coordenadas exactas
- [ ] **Contactos de Emergencia:** Notificar familiares/autoridades
- [ ] **Historial de Alertas:** Ver alertas pasadas en el chat
- [ ] **Resolución de Alertas:** Marcar alertas como resueltas
- [ ] **Integración con Servicios:** 911, policía, bomberos

### Mejoras Técnicas
- [ ] **WebSocket:** Notificaciones en tiempo real
- [ ] **Offline Support:** Almacenar alertas localmente
- [ ] **Batch Processing:** Envío masivo de notificaciones
- [ ] **Analytics:** Métricas de uso y efectividad

## 🧪 Testing

### Casos de Prueba
1. **Click normal:** Debe mostrar modal de confirmación
2. **Cancelar:** Debe volver al estado normal
3. **Confirmar:** Debe enviar API call y mostrar estado alerting
4. **Estado alerting:** Debe durar 5 segundos con animación
5. **Estado success:** Debe mostrar check verde por 2 segundos
6. **API error:** Debe manejar errores gracefully
7. **Coexistencia:** No debe interferir con FloatingReportButton

### Datos de Prueba
```bash
# Enviar alerta de prueba
curl -X POST http://localhost:3000/api/panic/send \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2024-01-15T10:30:00.000Z","location":"current"}'

# Obtener alertas activas
curl -X GET http://localhost:3000/api/panic/send
```

## ⚠️ Consideraciones de Seguridad

1. **Autenticación:** Todas las alertas requieren usuario autenticado
2. **Rate Limiting:** Considerar limitar frecuencia de alertas por usuario
3. **Validación:** Validar datos de entrada en el backend
4. **Logging:** Registrar todas las alertas para auditoría
5. **Privacidad:** No exponer información sensible en logs

## 📊 Métricas Sugeridas

- Número de alertas enviadas por barrio
- Tiempo de respuesta promedio
- Tasa de falsas alarmas
- Efectividad de las alertas (resolución)
- Uso por franja horaria/día de la semana
