# 🚀 Guía Rápida - Probar Claridad como App Nativa

> **5 minutos para tener tu app nativa corriendo**

---

## ⚡ **Inicio Súper Rápido**

### **📋 Prerrequisitos**
- ✅ Android Studio instalado
- ✅ Proyecto Claridad en tu máquina

### **🎯 3 Comandos y Listo**

```bash
# 1️⃣ Iniciar servidor (terminal 1)
npm run dev

# 2️⃣ Abrir Android Studio (terminal 2)
npm run cap:android

# 3️⃣ ¡Ejecutar! (dentro de Android Studio)
# Presiona Shift + F10 o clic en ▶️
```

---

## 📱 **Si es tu Primera Vez con Android Studio**

### **🎮 Crear Emulador (Solo la Primera Vez)**

1. **Busca el ícono 📱** en la barra lateral de Android Studio
2. **"Create Device"** → **"Phone"** → **"Pixel 6"**
3. **Descarga Android 13** (API 33) si te lo pide
4. **"Finish"** y espera que arranque

### **🚀 Ejecutar Tu App**

1. **Emulador corriendo** ✅
2. **Botón ▶️ verde** en Android Studio
3. **¡Boom!** 💥 Tu app se instala y abre

---

## 🎯 **¿Qué Vas a Ver?**

### **🎨 Experiencia Visual**
- **Splash screen azul** con logo "Claridad"
- **Pantalla completa** (sin barra del navegador)
- **Animaciones fluidas** a 60fps
- **UI nativa** que se siente real

### **🔧 Funcionalidades para Probar**

| Función | Cómo Probar | Diferencia vs Web |
|---------|-------------|-------------------|
| **🚨 Botón de Pánico** | Toca el botón rojo | Notificación nativa real |
| **📍 Ubicación** | Reportar incidente | GPS más preciso |
| **📷 Cámara** | Subir evidencia | App nativa de cámara |
| **👆 Gestos** | Swipe, long press | Respuesta táctil nativa |
| **⌨️ Teclado** | Escribir en formularios | Teclado inteligente |

---

## 🆘 **Si Algo No Funciona**

### **❌ Problemas Comunes**

#### **Android Studio no abre**
```bash
# Abrir manualmente:
# 1. Abre Android Studio
# 2. File → Open → android/ (carpeta)
```

#### **No hay emulador**
```bash
# En Android Studio:
# Tools → Device Manager → Create Device
```

#### **App no carga**
```bash
# Verificar servidor:
npm run dev
# Debe mostrar: http://localhost:3000
```

#### **Build falla**
```bash
# Limpiar y volver a intentar:
npm run cap:build
```

---

## 📞 **Ayuda Rápida**

### **🔍 Verificar que Todo Esté Bien**
```bash
# Verificar configuración
npx cap doctor

# Ver estado del proyecto
npx cap ls
```

### **🧹 Comandos de Limpieza**
```bash
# Si algo está raro, limpiar todo:
npm run cap:build  # Reconstruye todo limpio
```

---

## 🎉 **¡Listo para Impresionar!**

Una vez que veas tu app corriendo nativamente, podrás:

- 🚀 **Comparar performance** web vs nativa
- 🔧 **Probar funcionalidades** que solo funcionan en móvil
- 📦 **Generar APK** para compartir con el equipo

---

**💡 Tip:** Una vez que funcione, puedes generar un APK para compartir:
```bash
cd android
./gradlew assembleDebug
# APK en: android/app/build/outputs/apk/debug/
```

---

*¿Necesitas la guía completa? → Ver `CAPACITOR-MIGRATION.md`*
