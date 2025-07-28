# 🔄 Hot/Live Reload Setup - Capacitor

> **Guía completa para configurar hot reload en tu aplicación Claridad con Capacitor**

---

## 📋 **Resumen**

Esta configuración permite desarrollar tu aplicación Claridad con **hot reload** en dispositivos Android reales o emuladores, sincronizando automáticamente los cambios sin necesidad de reconstruir la aplicación.

---

## 🚀 **Configuración Rápida**

### **Opción 1: Script Automatizado (Recomendado)**

```bash
# Desarrollo con hot reload completo
npm run dev:android:hot

# O especificar puerto personalizado
npm run dev:android:hot 8080
```

### **Opción 2: Configuración Manual**

```bash
# 1. Configurar Capacitor para desarrollo
npm run cap:dev:setup

# 2. Iniciar servidor de desarrollo
npm run dev:server

# 3. En otra terminal, ejecutar en Android
npm run cap:run:android
```

---

## 🔧 **Archivos de Configuración**

### **capacitor.config.ts (Desarrollo)**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.claridad.app',
  appName: 'Claridad',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    url: 'http://192.168.1.100:3000', // IP local automática
    cleartext: true
  },
  // ... resto de configuración
};

export default config;
```

### **capacitor.config.ts (Producción)**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.claridad.app',
  appName: 'Claridad',
  webDir: 'out',
  server: {}, // Configuración vacía para producción
  // ... resto de configuración
};

export default config;
```

---

## 📱 **Cómo Funciona**

### **1. Detección Automática de IP**
- El script `get-local-ip.js` detecta automáticamente tu IP local
- Funciona en Windows, macOS y Linux
- Ignora interfaces de loopback y IPv6

### **2. Configuración Dinámica**
- `setup-capacitor-dev.js` modifica `capacitor.config.ts` automáticamente
- Hace backup de la configuración original
- Restaura automáticamente al finalizar

### **3. Servidor de Desarrollo**
- Next.js se ejecuta en `0.0.0.0:3000` (accesible desde red local)
- Variable `CAPACITOR_BUILD=true` para optimizaciones móviles
- Hot reload habilitado para cambios instantáneos

### **4. Sincronización Capacitor**
- `npx cap sync` sincroniza cambios con Android
- `npx cap run android` ejecuta la aplicación
- Los cambios se reflejan automáticamente

---

## 🛠️ **Scripts Disponibles**

### **Desarrollo**
```bash
# Hot reload completo (recomendado)
npm run dev:android:hot [puerto]

# Solo servidor de desarrollo
npm run dev:server [puerto]

# Solo configurar Capacitor
npm run cap:dev:setup [puerto]
```

### **Producción**
```bash
# Build de producción (limpia configuración)
npm run build:prod

# Solo limpiar configuración
npm run cap:prod:setup
```

### **Utilidades**
```bash
# Restaurar configuración original
npm run cap:restore

# Obtener IP local
node scripts/get-local-ip.js [puerto]
```

---

## 🔒 **Seguridad y Buenas Prácticas**

### **✅ Configuración Segura**

1. **No committear IPs locales:**
   ```bash
   # .gitignore ya incluye:
   capacitor.config.backup.ts
   capacitor.config.dev.ts
   ```

2. **Limpieza automática:**
   - Los scripts restauran automáticamente la configuración
   - Build de producción remueve configuración del servidor

3. **Variables de entorno:**
   ```bash
   # Solo en desarrollo
   CAPACITOR_BUILD=true
   HOSTNAME=0.0.0.0
   ```

### **⚠️ Consideraciones de Seguridad**

1. **Red local:**
   - Solo funciona en la misma red WiFi
   - No exponer puertos a internet

2. **Firewall:**
   - Asegúrate de que el puerto esté abierto en tu firewall
   - Windows: Permitir Next.js en Windows Defender

3. **Dispositivos:**
   - Solo conectar dispositivos de confianza
   - Usar emuladores para desarrollo inicial

---

## 🐛 **Solución de Problemas**

### **❌ Error: "Connection refused"**

```bash
# 1. Verificar que el servidor esté corriendo
curl http://localhost:3000

# 2. Verificar IP local
node scripts/get-local-ip.js

# 3. Verificar firewall
# Windows: Configuración → Firewall → Aplicaciones permitidas
```

### **❌ Error: "Unable to connect to server"**

```bash
# 1. Verificar que dispositivo y PC estén en la misma red
# 2. Probar ping desde dispositivo
ping [IP-DEL-PC]

# 3. Verificar configuración de Capacitor
cat capacitor.config.ts | grep url
```

### **❌ Error: "Build failed"**

```bash
# 1. Limpiar cache
npm run clean
rm -rf out/

# 2. Reinstalar dependencias
npm install

# 3. Reconstruir
npm run cap:build
```

### **❌ Error: "Permission denied"**

```bash
# Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# O ejecutar como administrador
```

---

## 📊 **Flujo de Desarrollo Recomendado**

### **1. Desarrollo Diario**
```bash
# Iniciar desarrollo con hot reload
npm run dev:android:hot

# Hacer cambios en el código
# Los cambios se reflejan automáticamente en el dispositivo
```

### **2. Testing**
```bash
# Probar en diferentes dispositivos
# Cambiar entre emulador y dispositivo real
# Verificar funcionalidades nativas
```

### **3. Build de Producción**
```bash
# Construir para producción
npm run build:prod

# Generar APK
cd android && ./gradlew assembleRelease
```

---

## 🔄 **Comandos de Depuración**

### **Ver Logs de Android**
```bash
# Abrir Android Studio
npx cap open android

# En Android Studio: View → Tool Windows → Logcat
```

### **Ver Logs del Servidor**
```bash
# Los logs aparecen en la terminal donde ejecutaste dev:server
# Buscar errores de conexión o compilación
```

### **Verificar Configuración**
```bash
# Ver configuración actual
cat capacitor.config.ts

# Ver IP local
node scripts/get-local-ip.js

# Verificar Capacitor
npx cap doctor
```

---

## 📱 **Optimizaciones para Dispositivos**

### **Performance**
- Usar `CAPACITOR_BUILD=true` para optimizaciones móviles
- Evitar recargas completas innecesarias
- Optimizar imágenes y assets

### **UX**
- Probar en dispositivos reales regularmente
- Verificar gestos táctiles
- Comprobar orientación de pantalla

### **Debugging**
- Usar Chrome DevTools para debugging remoto
- Verificar logs de Capacitor
- Monitorear uso de memoria

---

## 🎯 **Próximos Pasos**

1. ✅ **Configurar hot reload** (completado)
2. ⏳ **Optimizar performance** en dispositivos
3. ⏳ **Configurar push notifications**
4. ⏳ **Testing en múltiples dispositivos**
5. ⏳ **CI/CD para builds automáticos**

---

## 🆘 **Soporte**

- **Documentación Capacitor:** [Capacitor Docs](https://capacitorjs.com/docs)
- **Troubleshooting:** [Capacitor Troubleshooting](https://capacitorjs.com/docs/troubleshooting)
- **Equipo Claridad:** Para problemas específicos del proyecto

---

**🎉 ¡Tu aplicación Claridad ahora tiene hot reload completo!**

---

*Documentación actualizada: $(date)
Versión: 1.0.0
Estado: ✅ Configuración Completada*
