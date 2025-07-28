# 📱 Capacitor - Claridad App

> **Documentación principal para desarrollo móvil con Capacitor**

---

## 🚀 **Inicio Rápido**

### **Para Desarrollo con Hot Reload (RECOMENDADO)**
```bash
# Un comando que evita todos los problemas
npm run dev:android:robust
```

### **Para Producción**
```bash
# Build seguro para producción
npm run build:prod
```

---

## 📚 **Documentación Disponible**

### **🎯 Guías Principales**
- **[Guía Definitiva Hot Reload](GUIA-DEFINITIVA-HOT-RELOAD.md)** - **LEER PRIMERO**
- **[Flujo de Desarrollo](FLUJO-DESARROLLO.md)** - Flujo detallado paso a paso
- **[Solución de Problemas](SOLUCION-HOT-RELOAD.md)** - Si algo sale mal

### **📖 Guías de Referencia**
- **[Migración a Capacitor](CAPACITOR-MIGRATION.md)** - Historia de la migración
- **[Guía Rápida](GUIA-RAPIDA-CAPACITOR.md)** - Comandos básicos

---

## 🛠️ **Scripts Disponibles**

### **Desarrollo (Usar estos)**
```bash
# RECOMENDADO: Evita problemas de Gradle
npm run dev:android:robust

# ALTERNATIVA: Script simple
npm run dev:android:simple

# AVANZADO: Con instrucciones detalladas
npm run dev:android:advanced
```

### **Solución de Problemas**
```bash
# SOLUCIÓN COMPLETA: Para cualquier error
npm run fix-gradle-issue

# LIMPIEZA: Solo Android
npm run clean:android

# RESTAURAR: Configuración original
npm run cap:restore
```

### **Utilidades**
```bash
# Obtener IP local
node scripts/get-local-ip.js

# Ver dispositivos Android
adb devices

# Estado de Capacitor
npx cap doctor
```

---

## 🎯 **Flujo de Trabajo Recomendado**

### **1. Iniciar Desarrollo**
```bash
npm run dev:android:robust
```

### **2. Seguir Instrucciones**
- Abrir nueva terminal para servidor
- Ejecutar `npx cap run android`
- Desarrollar con hot reload

### **3. Finalizar**
```bash
# Ctrl+C en ambas terminales
npm run cap:restore
```

---

## 🚨 **Si Algo Sale Mal**

### **Error de Gradle**
```bash
npm run fix-gradle-issue
npm run dev:android:robust
```

### **No se conecta al servidor**
```bash
# Verificar que el servidor esté "Ready"
# Verificar IP en capacitor.config.ts
npm run cap:dev:setup
```

### **Puerto en uso**
```bash
npm run dev:android:robust 8080
```

---

## 📱 **Requisitos**

### **Software Necesario**
- ✅ Node.js 18+
- ✅ Android Studio
- ✅ Emulador Android o dispositivo real
- ✅ Capacitor CLI

### **Configuración**
- ✅ Emulador Android corriendo
- ✅ Depuración USB habilitada (dispositivo real)
- ✅ Red WiFi compartida (PC y dispositivo)

---

## 🎉 **Indicadores de Éxito**

### **Hot Reload Funcionando:**
- ✅ **Dos terminales abiertas**
- ✅ **Servidor muestra "Ready"**
- ✅ **APK instalado en emulador**
- ✅ **Cambios se reflejan automáticamente**

### **Comportamiento Normal:**
- ✅ **APK se cierra al cerrar terminales** = Normal
- ✅ **"Deploying" se queda ahí** = Funcionando
- ✅ **Hot reload activo** = Perfecto

---

## 🆘 **Soporte**

### **Documentación**
- **[Guía Definitiva](GUIA-DEFINITIVA-HOT-RELOAD.md)** - Solución a todos los problemas
- **[Flujo de Desarrollo](FLUJO-DESARROLLO.md)** - Paso a paso detallado
- **[Solución de Problemas](SOLUCION-HOT-RELOAD.md)** - Errores comunes

### **Comandos de Emergencia**
```bash
# Reset completo
npm run fix-gradle-issue && npm run dev:android:robust

# Restaurar todo
npm run cap:restore
```

---

## 🎯 **Checklist de Inicio**

Antes de empezar a desarrollar:

- [ ] **Emulador Android** corriendo
- [ ] **Script robusto** ejecutado
- [ ] **Servidor** mostrando "Ready"
- [ ] **APK** instalado en emulador
- [ ] **Hot reload** funcionando

---

**🎉 ¡Tu equipo tiene hot reload sin problemas!**

---

*Documentación actualizada: $(date)
Versión: 2.0.0
Estado: ✅ README Principal Completado*
