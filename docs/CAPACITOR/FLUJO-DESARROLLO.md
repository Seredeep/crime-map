# 🔄 Flujo de Desarrollo con Hot Reload

> **Guía paso a paso para desarrollar con hot reload en Android**

---

## 🚀 **Flujo Completo de Desarrollo**

### **1. Iniciar Desarrollo**
```bash
# Opción 1: Script avanzado (recomendado)
npm run dev:android:advanced

# Opción 2: Script simple
npm run dev:android:simple
```

### **2. Seguir las Instrucciones**

#### **Terminal 1: Servidor de Desarrollo**
```bash
npm run dev -- --port 3000 --hostname 0.0.0.0
```
**Espera hasta que aparezca:**
```
✓ Ready in 2.3s
```

#### **Terminal 2: Android**
```bash
npx cap run android
```
**Espera hasta que:**
- Se instale el APK
- Se abra la app en el emulador
- Aparezca tu aplicación

### **3. Desarrollo**
- ✅ **Haz cambios en tu código**
- ✅ **Los cambios se reflejan automáticamente**
- ✅ **No necesitas cerrar nada**

### **4. Finalizar**
- **Presiona Ctrl+C en AMBAS terminales**
- **Ejecuta:** `npm run cap:restore`

---

## 📱 **¿Por Qué Se Cierra el APK?**

### **✅ Comportamiento Normal**

| Situación | ¿Es Normal? | Explicación |
|-----------|-------------|-------------|
| **Se cierra al cerrar terminales** | ✅ SÍ | Es una app de desarrollo |
| **Se queda en "Deploying"** | ✅ SÍ | Está esperando conexión |
| **No se conecta al servidor** | ❌ NO | Verificar que el servidor esté "Ready" |
| **Error de build** | ❌ NO | Usar `npm run clean:android` |

### **🔄 Cómo Funciona**

1. **Terminal 1:** Sirve tu aplicación web en `http://192.168.0.97:3000`
2. **Terminal 2:** Instala y ejecuta la app en Android
3. **Android:** Se conecta al servidor y carga tu aplicación
4. **Hot Reload:** Los cambios se sincronizan automáticamente

---

## 🛠️ **Scripts Disponibles**

### **Desarrollo**
```bash
# Script avanzado (mejor guía)
npm run dev:android:advanced

# Script simple
npm run dev:android:simple

# Solo servidor
npm run dev:server
```

### **Utilidades**
```bash
# Limpiar Android
npm run clean:android

# Restaurar configuración
npm run cap:restore

# Build de producción
npm run build:prod
```

---

## 🐛 **Solución de Problemas**

### **Problema: "No se conecta al servidor"**
```bash
# 1. Verificar que el servidor esté "Ready"
# 2. Verificar IP en capacitor.config.ts
cat capacitor.config.ts | grep url

# 3. Probar conectividad
curl http://localhost:3000
```

### **Problema: "Error de build"**
```bash
# Limpiar completamente
npm run clean:android

# Reconstruir
npm run cap:build
```

### **Problema: "APK no se instala"**
```bash
# Verificar emulador
adb devices

# Reiniciar emulador
# En Android Studio: Device Manager → Stop → Start
```

---

## 📊 **Flujo de Trabajo Recomendado**

### **Desarrollo Diario**
1. **Iniciar:** `npm run dev:android:advanced`
2. **Seguir instrucciones** paso a paso
3. **Desarrollar** con hot reload
4. **Finalizar:** Ctrl+C + `npm run cap:restore`

### **Testing**
1. **Probar en emulador** primero
2. **Probar en dispositivo real** después
3. **Verificar funcionalidades nativas**

### **Producción**
1. **Build:** `npm run build:prod`
2. **Generar APK:** `cd android && ./gradlew assembleRelease`
3. **Instalar en dispositivo**

---

## 🎯 **Consejos Importantes**

### **✅ Hacer**
- Mantener ambas terminales abiertas
- Esperar a que el servidor esté "Ready"
- Usar `npm run cap:restore` al finalizar
- Probar cambios frecuentemente

### **❌ No Hacer**
- Cerrar terminales durante desarrollo
- Modificar `capacitor.config.ts` manualmente
- Committear configuraciones de desarrollo
- Usar el mismo puerto en múltiples proyectos

---

## 🔄 **Comandos de Depuración**

### **Ver Logs**
```bash
# Logs de Android
adb logcat | grep -i capacitor

# Logs del servidor
# Aparecen en la terminal del servidor

# Verificar configuración
cat capacitor.config.ts | grep server
```

### **Verificar Estado**
```bash
# Dispositivos conectados
adb devices

# IP local
node scripts/get-local-ip.js

# Estado de Capacitor
npx cap doctor
```

---

## 🎉 **¡Hot Reload Funcionando!**

Tu configuración está **perfecta**. El comportamiento que describes es **completamente normal**:

- ✅ **Dos terminales** = Correcto
- ✅ **APK se cierra** = Normal
- ✅ **"Deploying"** = Funcionando
- ✅ **Hot reload** = Activo

**¡Disfruta desarrollando con hot reload!** 🚀📱

---

*Documentación actualizada: $(date)
Versión: 1.2.0
Estado: ✅ Flujo de Trabajo Optimizado*
