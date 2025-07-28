# 🚀 Guía Definitiva - Hot Reload para el Equipo

> **Guía completa para que cualquier miembro del equipo use hot reload sin problemas**

---

## 📋 **Resumen Ejecutivo**

Esta guía te permitirá desarrollar la aplicación Claridad con **hot reload** en Android sin problemas. Hemos solucionado todos los errores de Gradle y creado scripts automatizados.

---

## 🎯 **Flujo de Trabajo Recomendado (SIN PROBLEMAS)**

### **Opción 1: Script Robusto (RECOMENDADO)**
```bash
# Un solo comando que evita todos los problemas
npm run dev:android:robust
```

### **Opción 2: Script Simple**
```bash
# Alternativa más básica
npm run dev:android:simple
```

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

### **Solución de Problemas (Si algo falla)**
```bash
# SOLUCIÓN COMPLETA: Para cualquier error de Gradle
npm run fix-gradle-issue

# LIMPIEZA BÁSICA: Solo Android
npm run clean:android

# RESTAURAR: Configuración original
npm run cap:restore
```

### **Producción**
```bash
# Build seguro para producción
npm run build:prod
```

---

## 📱 **Paso a Paso SIN PROBLEMAS**

### **Paso 1: Iniciar Desarrollo**
```bash
# Ejecutar el script robusto
npm run dev:android:robust
```

**El script hará automáticamente:**
- ✅ Limpieza preventiva de Android
- ✅ Configuración de Capacitor
- ✅ Build de la aplicación
- ✅ Instrucciones paso a paso

### **Paso 2: Seguir las Instrucciones**

#### **Terminal 1: Servidor de Desarrollo**
```bash
npm run dev -- --port 3000 --hostname 0.0.0.0
```
**Esperar hasta que aparezca:**
```
✓ Ready in 2.3s
```

#### **Terminal 2: Android**
```bash
npx cap run android
```

### **Paso 3: Desarrollo**
- ✅ **Haz cambios en tu código**
- ✅ **Los cambios se reflejan automáticamente**
- ✅ **No necesitas cerrar nada**

### **Paso 4: Finalizar**
```bash
# Presionar Ctrl+C en AMBAS terminales
# Luego ejecutar:
npm run cap:restore
```

---

## 🚨 **Si Algo Sale Mal (Solución Rápida)**

### **Error: "Gradle build failed"**
```bash
# Solución completa automática
npm run fix-gradle-issue

# Luego continuar
npm run dev:android:robust
```

### **Error: "No se conecta al servidor"**
```bash
# 1. Verificar que el servidor esté "Ready"
# 2. Verificar IP en capacitor.config.ts
cat capacitor.config.ts | grep url

# 3. Si la IP cambió, ejecutar:
npm run cap:dev:setup
```

### **Error: "Puerto en uso"**
```bash
# Cambiar puerto
npm run dev:android:robust 8080
```

### **Error: "Dispositivo no encontrado"**
```bash
# Verificar dispositivos
adb devices

# Reiniciar emulador en Android Studio
```

---

## 🔧 **Comandos de Verificación**

### **Verificar Estado**
```bash
# IP local
node scripts/get-local-ip.js

# Dispositivos Android
adb devices

# Estado de Capacitor
npx cap doctor
```

### **Verificar Configuración**
```bash
# Ver configuración actual
cat capacitor.config.ts | grep server

# Ver logs de Android
adb logcat | grep -i capacitor
```

---

## 📊 **Comparación de Scripts**

| Script | ¿Cuándo Usar? | Ventajas | Desventajas |
|--------|---------------|----------|-------------|
| **`dev:android:robust`** | **Desarrollo diario** | ✅ Evita problemas de Gradle<br>✅ Limpieza automática<br>✅ Instrucciones claras | ⚠️ Un poco más lento |
| **`dev:android:simple`** | Desarrollo rápido | ✅ Rápido<br>✅ Simple | ❌ Puede fallar con Gradle |
| **`dev:android:advanced`** | Primera vez | ✅ Instrucciones detalladas<br>✅ Guía paso a paso | ⚠️ Más verboso |

---

## 🎯 **Recomendaciones para el Equipo**

### **✅ Hacer**
- Usar `npm run dev:android:robust` para desarrollo diario
- Seguir las instrucciones que aparecen en pantalla
- Mantener ambas terminales abiertas durante desarrollo
- Usar `npm run cap:restore` al finalizar

### **❌ No Hacer**
- Usar scripts manuales sin los automatizados
- Cerrar terminales durante desarrollo
- Modificar `capacitor.config.ts` manualmente
- Committear configuraciones de desarrollo

### **🆘 Si Hay Problemas**
1. **Primero:** `npm run fix-gradle-issue`
2. **Segundo:** `npm run dev:android:robust`
3. **Tercero:** Revisar esta documentación
4. **Cuarto:** Contactar al equipo

---

## 🔄 **Flujo de Trabajo Diario**

### **Mañana (Iniciar Desarrollo)**
```bash
# 1. Iniciar
npm run dev:android:robust

# 2. Seguir instrucciones
# 3. Desarrollar con hot reload
```

### **Tarde (Continuar Desarrollo)**
```bash
# Si las terminales siguen abiertas, continuar
# Si se cerraron, repetir el proceso
```

### **Noche (Finalizar)**
```bash
# 1. Ctrl+C en ambas terminales
# 2. Limpiar configuración
npm run cap:restore
```

---

## 🐛 **Problemas Comunes y Soluciones**

### **Problema: "Cannot snapshot index.html"**
```bash
# Solución automática
npm run fix-gradle-issue
```

### **Problema: "Connection refused"**
```bash
# Verificar servidor
curl http://localhost:3000

# Si no responde, reiniciar servidor
```

### **Problema: "Build failed"**
```bash
# Limpieza completa
npm run fix-gradle-issue
npm run dev:android:robust
```

### **Problema: "APK no se instala"**
```bash
# Verificar emulador
adb devices

# Reiniciar emulador en Android Studio
```

---

## 📱 **Optimizaciones para Dispositivos**

### **Performance**
- Usar `CAPACITOR_BUILD=true` (automático)
- Evitar recargas completas innecesarias
- Optimizar imágenes y assets

### **UX**
- Probar en dispositivos reales regularmente
- Verificar gestos táctiles
- Comprobar orientación de pantalla

---

## 🎉 **¡Hot Reload Funcionando!**

### **Indicadores de Éxito:**
- ✅ **Dos terminales abiertas**
- ✅ **Servidor muestra "Ready"**
- ✅ **APK instalado en emulador**
- ✅ **Cambios se reflejan automáticamente**

### **Comportamiento Normal:**
- ✅ **APK se cierra al cerrar terminales** = Normal
- ✅ **"Deploying" se queda ahí** = Funcionando
- ✅ **Hot reload activo** = Perfecto

---

## 🆘 **Soporte del Equipo**

### **Documentación Disponible:**
- `docs/CAPACITOR/GUIA-DEFINITIVA-HOT-RELOAD.md` - Esta guía
- `docs/CAPACITOR/FLUJO-DESARROLLO.md` - Flujo detallado
- `docs/CAPACITOR/SOLUCION-HOT-RELOAD.md` - Solución de problemas

### **Comandos de Emergencia:**
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

**🎉 ¡Tu equipo ahora tiene hot reload sin problemas!**

---

*Documentación actualizada: $(date)
Versión: 2.0.0
Estado: ✅ Guía Definitiva Completada*
