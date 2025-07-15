# Flujo de Experiencia de Usuario (UX) - Desde Login a Onboarding

## Introducción
Este documento describe el flujo de UX desde el inicio de sesión hasta la finalización del onboarding en la aplicación. Se basa en el código fuente y documentación existente, con énfasis en la integración con Capacitor para la app nativa.

## 1. Pantalla de Login (/auth/signin)
- **Componente principal:** `src/app/auth/signin/page.tsx`
- **Funcionalidad:**
  - Formulario para email y contraseña.
  - Opción de login con Google.
  - Manejo de errores (ej: cuenta pendiente de aprobación).
- **UX en Nativo (Capacitor):**
  - Teclado nativo optimizado.
  - Transiciones fluidas y pantalla completa sin barra de navegador.
- **Redirección:** Si el usuario no ha completado onboarding, middleware redirige a /onboarding.

## 2. Pantalla de Signup (/auth/signup)
- **Componente principal:** `src/app/auth/signup/page.tsx`
- **Funcionalidad:**
  - Formulario para nombre, email, contraseña y confirmación.
  - Validaciones client-side (contraseña mínima 8 chars, coincidencia).
  - Llama a API /api/register para crear usuario pendiente de aprobación.
- **UX en Nativo:**
  - Similar al login, con foco en usabilidad táctil.
- **Después del Signup:** Redirige a login tras mensaje de éxito.

## 3. Onboarding (/onboarding)
- **Componente principal:** `src/app/onboarding/page.tsx`
- **Funcionalidad:**
  - Formulario para completar info: nombre, apellido, manzana, lote, barrio (seleccionado de lista cargada desde /api/neighborhoods).
  - Asigna automáticamente a un chat basado en barrio (usando Firestore).
  - Actualiza sesión con onboarded: true.
- **UX en Nativo:**
  - Interfaz móvil-friendly con selectores y validaciones.
  - Integración con GPS si es necesario (vía Capacitor Geolocation).
- **Redirección:** Tras completar, redirige a página principal (/).

## 4. Middleware y Redirecciones
- **Archivo:** `src/middleware.ts`
- **Lógica:**
  - Si no autenticado: Redirige a /auth/signin.
  - Si autenticado pero onboarded=false: Redirige a /onboarding.
  - Protege rutas API y páginas sensibles.
- **Impacto en UX:** Asegura flujo secuencial: login → onboarding → app completa.

## 5. Optimizaciones para App Nativa con Capacitor
- **Plugins relevantes:** Keyboard para manejo de inputs, StatusBar para inmersión.
- **Ventajas:** Mejor performance, gestos nativos, notificaciones post-onboarding.
- **Componentes móviles:** Vistas como MobileBottomTabs para navegación post-onboarding.

## Notas Adicionales
- **Autenticación:** Usa NextAuth con providers Credentials y Google.
- **Seguridad:** Cuentas nuevas requieren aprobación admin (enabled=true).
- **Mejoras sugeridas:** Añadir tutoriales en onboarding para usuarios nuevos.

*Documento creado por AI Assistant - Fecha: [Inserte fecha actual]*
