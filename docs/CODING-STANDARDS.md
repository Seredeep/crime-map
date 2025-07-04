# Estándares de Código - Claridad

## Estilo de Comentarios y Regiones

### Regiones Plegables

Usar el estilo de regiones plegables con `#region` y `#endregion` para organizar el código en secciones lógicas:

```typescript
// #region Imports
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
// #endregion

// #region Configuration
const config = {
  // configuración aquí
};
// #endregion

// #region Component
export default function MyComponent() {
  return (
    <div>
      {/* #region Header */}
      <header>
        <h1>Título</h1>
      </header>
      {/* #endregion */}

      {/* #region Content */}
      <main>
        <p>Contenido</p>
      </main>
      {/* #endregion */}
    </div>
  );
}
// #endregion
```

### Reglas para Regiones

1. **Nombres descriptivos**: Usar nombres que describan claramente el contenido
2. **Jerarquía clara**: Usar subregiones para organizar contenido relacionado
3. **Consistencia**: Mantener el mismo estilo en todo el proyecto
4. **Evitar separadores visuales**: No usar `===` o líneas decorativas

### Ejemplos de Nombres de Regiones

#### Para Imports:
- `Imports`
- `External Imports`
- `Internal Imports`
- `Type Imports`

#### Para Configuración:
- `Configuration`
- `Constants`
- `Settings`
- `Environment Variables`

#### Para Componentes:
- `Component`
- `Props Interface`
- `State Management`
- `Event Handlers`
- `Render Methods`

#### Para JSX:
- `Header`
- `Navigation`
- `Content`
- `Sidebar`
- `Footer`
- `Modal Content`

### Comentarios Inline

Para comentarios dentro del código, usar el estilo de comentarios de JavaScript/TypeScript:

```typescript
// Comentario de una línea
const value = 42; // Comentario al final de línea

/*
 * Comentario de múltiples líneas
 * para explicaciones más complejas
 */

/**
 * Comentario JSDoc para funciones
 * @param param - Descripción del parámetro
 * @returns Descripción del retorno
 */
function example(param: string): string {
  return param;
}
```

### Archivos de Configuración

Para archivos de configuración como `layout.tsx`, `page.tsx`, etc., usar esta estructura:

```typescript
// #region Imports
// imports aquí
// #endregion

// #region Configuration
// configuración aquí
// #endregion

// #region Component
export default function Component() {
  return (
    <div>
      {/* #region Header */}
      {/* contenido del header */}
      {/* #endregion */}

      {/* #region Content */}
      {/* contenido principal */}
      {/* #endregion */}
    </div>
  );
}
// #endregion
```

### Archivos de Servicios/Utils

Para archivos de servicios, utilidades y lógica de negocio:

```typescript
// #region Imports
// imports aquí
// #endregion

// #region Types
// tipos y interfaces
// #endregion

// #region Constants
// constantes
// #endregion

// #region Helper Functions
// funciones auxiliares
// #endregion

// #region Main Functions
// funciones principales
// #endregion
```

### Archivos de API Routes

Para archivos de rutas de API:

```typescript
// #region Imports
// imports aquí
// #endregion

// #region Types
// tipos para la API
// #endregion

// #region Validation
// validación de datos
// #endregion

// #region Handler
export async function GET(request: Request) {
  // #region Request Processing
  // procesamiento de la request
  // #endregion

  // #region Response
  // preparación de la respuesta
  // #endregion
}
// #endregion
```

## Aplicación del Estilo

Este estilo de comentarios debe aplicarse en:

- ✅ `layout.tsx`
- ✅ `page.tsx`
- ✅ Componentes React
- ✅ Servicios y utilidades
- ✅ Rutas de API
- ✅ Archivos de configuración
- ✅ Hooks personalizados

## Beneficios

1. **Navegación rápida**: Fácil colapso/expansión de secciones
2. **Legibilidad**: Código más organizado y fácil de leer
3. **Mantenimiento**: Más fácil encontrar y modificar secciones específicas
4. **Consistencia**: Estilo uniforme en todo el proyecto
5. **Productividad**: Mejor experiencia de desarrollo en el editor
