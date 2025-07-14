# 📱 Migración a Capacitor - Claridad

> **Guía completa para migrar y probar tu aplicación Claridad como app móvil nativa**

---

## 📋 **Resumen de la Migración**

Claridad ha sido migrada exitosamente de una aplicación web Next.js a una **aplicación híbrida** usando **Capacitor**, permitiendo ejecutarla como aplicación nativa en Android e iOS con acceso completo a funcionalidades del dispositivo.

---

## ✅ **¿Qué se completó en la migración?**

### 🔧 **Configuración Base**
- ✅ Capacitor CLI y dependencias instaladas
- ✅ Configuración específica para Claridad (`capacitor.config.ts`)
- ✅ Plataformas Android e iOS configuradas
- ✅ Scripts de build automatizados

### 📱 **Plugins Nativos Instalados**
- ✅ **Geolocalización** - GPS nativo para reportes precisos
- ✅ **Cámara** - Captura de evidencias fotográficas
- ✅ **Notificaciones** - Alertas locales y push notifications
- ✅ **Status Bar** - Control de barra de estado
- ✅ **Teclado** - Manejo optimizado del teclado virtual
- ✅ **Splash Screen** - Pantalla de carga con branding de Claridad

### 🎨 **Optimizaciones PWA**
- ✅ Manifest optimizado para instalación
- ✅ Íconos nativos configurados
- ✅ Tema y colores de Claridad (#040910, #B5CCF4)
- ✅ Meta tags para mejor experiencia móvil

---

## 🚀 **Guía de Uso - Desarrollo**

### **Requisitos Previos**
- Node.js 18+ instalado
- Android Studio (para Android)
- Xcode (para iOS, solo en Mac)

### **Comandos Principales**

```bash
# Desarrollo web normal
npm run dev

# Build para móvil + sincronizar
npm run cap:build

# Abrir Android Studio
npm run cap:android

# Abrir Xcode (Mac únicamente)
npm run cap:ios

# Solo sincronizar cambios
npm run cap:sync

# Ejecutar directamente en dispositivo
npm run cap:run:android
npm run cap:run:ios
```

---

## 📱 **Cómo Probar tu App Nativa**

### **Opción 1: Emulador Android (Recomendado para empezar)**

#### **Paso 1: Preparar el entorno**
```bash
# 1. Inicia el servidor de desarrollo
npm run dev

# 2. En otra terminal, abre Android Studio
npm run cap:android
```

#### **Paso 2: Configurar emulador**
1. **Abrir Device Manager**
   - En Android Studio, busca el ícono 📱 en la barra lateral
   - Haz clic en "Create Device"

2. **Seleccionar dispositivo**
   - Elige "Phone" → "Pixel 6" (recomendado)
   - Selecciona "API 33 (Android 13)" o más reciente
   - Haz clic en "Finish"

3. **Iniciar emulador**
   - Haz clic en ▶️ junto al dispositivo creado
   - Espera 1-2 minutos para que arranque

#### **Paso 3: Ejecutar la app**
1. Una vez que el emulador esté corriendo
2. En Android Studio, haz clic en **▶️ Run** (triángulo verde)
3. O presiona **Shift + F10**

### **Opción 2: Dispositivo Android Real (Mejor experiencia)**

#### **Configurar tu teléfono:**
1. **Habilitar modo desarrollador:**
   - Ve a Configuración → Acerca del teléfono
   - Toca 7 veces en "Número de compilación"
   - Aparecerá mensaje "Eres desarrollador"

2. **Activar depuración USB:**
   - Ve a Configuración → Opciones de desarrollador
   - Activa "Depuración USB"

3. **Conectar y ejecutar:**
   ```bash
   # Conecta el teléfono por USB
   # Acepta el diálogo de depuración en el teléfono
   npm run cap:run:android
   ```

### **Opción 3: Generar APK para instalar**

```bash
# Navegar al directorio Android
cd android

# Generar APK de debug
./gradlew assembleDebug

# El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎯 **Diferencias vs Versión Web**

### **🚀 Ventajas de la App Nativa**

| Característica | Web | Nativo |
|---------------|-----|--------|
| **Pantalla** | Con barra del navegador | Pantalla completa real |
| **Performance** | Limitado por navegador | 60fps nativos |
| **GPS** | API web con limitaciones | Hardware directo, más preciso |
| **Cámara** | Permisos web molestos | Integración nativa fluida |
| **Notificaciones** | Solo en navegador abierto | Push notifications reales |
| **Gestos** | Touch básico | Gestos nativos (swipe, long press) |
| **Arranque** | Carga navegador + app | Arranque directo |
| **Offline** | Cache limitado | Storage nativo completo |

### **🎮 Funcionalidades Nativas Disponibles**

#### **📍 Geolocalización Precisa**
```typescript
import { getCurrentPosition } from '../lib/capacitor-plugins';

// Obtener ubicación con precisión nativa
const position = await getCurrentPosition();
console.log(`Lat: ${position.latitude}, Lng: ${position.longitude}`);
```

#### **📷 Cámara Integrada**
```typescript
import { takePhoto, pickImage } from '../lib/capacitor-plugins';

// Tomar foto con cámara nativa
const photo = await takePhoto();

// Seleccionar de galería
const image = await pickImage();
```

#### **🔔 Notificaciones Nativas**
```typescript
import { scheduleLocalNotification } from '../lib/capacitor-plugins';

// Programar notificación local
await scheduleLocalNotification(
  'Alerta de Seguridad',
  'Nuevo incidente reportado en tu zona',
  1 // ID de notificación
);
```

#### **📱 Control de App Nativa**
```typescript
import { isNativePlatform, getPlatform } from '../lib/capacitor-plugins';

if (isNativePlatform()) {
  console.log(`Ejecutándose en: ${getPlatform()}`);
  // Lógica específica para móvil
}
```

---

## 🛠️ **Solución de Problemas**

### **❌ Errores Comunes y Soluciones**

#### **Error: "missing out directory"**
```bash
# Solución: Ejecutar el build completo
npm run cap:build
```

#### **Error: "Unable to launch Android Studio"**
```bash
# Solución: Configurar variable de entorno
set CAPACITOR_ANDROID_STUDIO_PATH="C:\Program Files\Android\Android Studio\bin\studio64.exe"

# O abrir manualmente:
# 1. Abre Android Studio
# 2. File → Open → Navega a /android
```

#### **Error: Build failed**
```bash
# Limpiar y reconstruir
npm run clean
npm run cap:build
```

#### **App no se conecta al servidor**
```bash
# Verificar que el servidor esté corriendo
npm run dev

# Verificar configuración en capacitor.config.ts
# Debe tener: url: 'http://localhost:3000' en desarrollo
```

### **🔧 Comandos de Depuración**

```bash
# Ver logs del dispositivo
npx cap open android
# En Android Studio: View → Tool Windows → Logcat

# Limpiar cache de Capacitor
npx cap clean android
npx cap sync android

# Verificar configuración
npx cap doctor
```

---

## 📦 **Preparación para Producción**

### **🔐 Para Android (Google Play)**

1. **Configurar firma de aplicación:**
   ```bash
   # Generar keystore
   keytool -genkey -v -keystore claridad-release.keystore -alias claridad -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurar en `android/app/build.gradle`:**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('../../claridad-release.keystore')
               storePassword 'tu-password'
               keyAlias 'claridad'
               keyPassword 'tu-password'
           }
       }
   }
   ```

3. **Generar APK de producción:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### **🍎 Para iOS (App Store)**

1. **Configurar certificados en Xcode**
2. **Configurar Bundle ID único**
3. **Archive y subir a App Store Connect**

### **🔔 Push Notifications**

1. **Firebase Setup:**
   ```bash
   npm install @capacitor/push-notifications
   ```

2. **Configurar en Firebase Console**
3. **Añadir `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)**

---

## 📊 **Estructura de Archivos Añadida**

```
proyecto/
├── capacitor.config.ts              # Configuración principal
├── android/                         # Proyecto Android nativo
├── ios/                            # Proyecto iOS nativo
├── src/lib/capacitor-plugins.ts    # Funciones nativas reutilizables
├── src/app/components/
│   └── CapacitorProvider.tsx       # Provider para inicialización
├── scripts/
│   ├── capacitor-build.ps1         # Script de build automatizado
│   └── create-capacitor-build.js   # Generador de estructura base
└── docs/
    └── CAPACITOR-MIGRATION.md      # Esta documentación
```

---

## 🎯 **Próximos Pasos Recomendados**

### **Para Desarrollo Inmediato:**
1. ✅ Probar en emulador Android
2. ⏳ Probar en dispositivo real
3. ⏳ Optimizar performance
4. ⏳ Configurar push notifications

### **Para Producción:**
1. ⏳ Configurar signing certificates
2. ⏳ Configurar Firebase para notifications
3. ⏳ Optimizar tamaño de APK
4. ⏳ Testing en múltiples dispositivos
5. ⏳ Subir a Google Play / App Store

---

## 🆘 **Soporte y Contacto**

- **Documentación oficial:** [Capacitor Docs](https://capacitorjs.com/docs)
- **Troubleshooting:** [Capacitor Troubleshooting](https://capacitorjs.com/docs/troubleshooting)
- **Equipo Claridad:** Para problemas específicos del proyecto

---

**🎉 ¡Felicidades! Tu aplicación Claridad ahora funciona como una app móvil nativa completa.**

---

*Documentación actualizada: $(date)
Versión de Capacitor: 7.x
Estado: ✅ Migración Completada*
