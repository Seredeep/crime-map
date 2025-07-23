# Claridad Branding System

## Visión General

El sistema de branding de Claridad se basa en el concepto de **claridad** y **minimalismo**, reflejando la naturaleza del logo que presenta elementos radiantes en blanco y negro. El diseño busca transmitir transparencia, precisión y confianza.

## Paleta de Colores

### Colores Principales

- **Claridad White** (`#FFFFFF`): Color principal de la marca
- **Claridad Off-White** (`#FAFAFA`): Variación sutil del blanco
- **Claridad Light Gray** (`#F3F4F6`): Gris muy claro para fondos secundarios
- **Claridad Gray** (`#9CA3AF`): Gris medio para texto secundario
- **Claridad Dark Gray** (`#374151`): Gris oscuro para bordes
- **Claridad Darker Gray** (`#1F2937`): Gris muy oscuro para fondos
- **Claridad Black** (`#111827`): Negro para fondos principales

### Colores de Estado

- **Success** (`#10B981`): Verde esmeralda para estados exitosos
- **Warning** (`#F59E0B`): Amarillo para advertencias
- **Error** (`#EF4444`): Rojo para errores
- **Info** (`#3B82F6`): Azul para información

### Colores de Emergencia

- **Alert** (`#DC2626`): Rojo intenso para alertas críticas
- **Panic** (`#EA580C`): Naranja para botones de pánico

## Tipografía

- **Familia Principal**: Manrope
- **Pesos**: 200 (Extra Light) a 800 (Extra Bold)
- **Estilo**: Sans-serif moderno y legible

## Elementos de Diseño

### Logo
- Logo minimalista en blanco y negro
- Elementos radiantes que simbolizan claridad y enfoque
- Animación sutil de rotación opcional

### Botones
- **Botones Primarios**: Fondo blanco con texto negro
- **Botones Secundarios**: Fondo transparente con bordes blancos
- **Botones de Emergencia**: Colores específicos (rojo/naranja) con efectos de glow

### Efectos Visuales
- **Glassmorphism**: Efectos de vidrio con blur y transparencia
- **Glow Effects**: Sombras sutiles en blanco para elementos importantes
- **Animaciones**: Transiciones suaves y naturales

## Implementación en CSS

### Variables CSS
```css
:root {
  /* Claridad Brand Colors */
  --clarity-white: #FFFFFF;
  --clarity-off-white: #FAFAFA;
  --clarity-light-gray: #F3F4F6;
  --clarity-gray: #9CA3AF;
  --clarity-dark-gray: #374151;
  --clarity-darker-gray: #1F2937;
  --clarity-black: #111827;

  /* Accent colors */
  --clarity-primary: #FFFFFF;
  --clarity-primary-hover: #F9FAFB;
  --clarity-secondary: #F3F4F6;
  --clarity-accent: #E5E7EB;

  /* Status colors */
  --clarity-success: #10B981;
  --clarity-warning: #F59E0B;
  --clarity-error: #EF4444;
  --clarity-info: #3B82F6;

  /* Alert colors */
  --clarity-alert: #DC2626;
  --clarity-panic: #EA580C;
}
```

### Clases de Tailwind
```css
/* Colores de Claridad */
.bg-clarity-white { background-color: #FFFFFF; }
.bg-clarity-off-white { background-color: #FAFAFA; }
.bg-clarity-light-gray { background-color: #F3F4F6; }
.text-clarity-white { color: #FFFFFF; }
.text-clarity-gray { color: #9CA3AF; }
.border-clarity-dark-gray { border-color: #374151; }
```

## Componentes Principales

### Navbar
- Fondo oscuro con elementos blancos
- Hover effects sutiles en blanco
- Logo con gradiente blanco

### Botones Flotantes
- **Reportar**: Rojo con efectos de glow
- **Pánico**: Naranja con efectos de glow
- Efectos de glassmorphism y animaciones

### Cards y Contenedores
- Fondos semi-transparentes
- Bordes sutiles en gris
- Efectos de hover con elevación

## Guías de Uso

### Cuándo usar cada color
- **Blanco**: Elementos principales, texto importante, botones primarios
- **Grises**: Fondos, bordes, texto secundario
- **Verde**: Estados exitosos, confirmaciones
- **Rojo**: Errores, alertas críticas
- **Naranja**: Advertencias, botones de pánico

### Accesibilidad
- Contraste mínimo de 4.5:1 para texto
- Estados de hover y focus claramente definidos
- Colores no son la única forma de transmitir información

### Responsive Design
- Colores se adaptan a diferentes tamaños de pantalla
- Efectos de glassmorphism se ajustan según el dispositivo
- Animaciones optimizadas para móviles

## Evolución del Branding

Este sistema de branding evoluciona desde el anterior que usaba azules y colores más vibrantes, hacia un enfoque más minimalista y elegante que refleja mejor la identidad de Claridad como plataforma de transparencia y seguridad comunitaria.

## Archivos Modificados

- `src/app/globals.css`: Variables CSS y estilos base
- `tailwind.config.ts`: Configuración de colores de Tailwind
- `src/app/components/ClaridadLogo.tsx`: Logo actualizado
- `src/app/components/Navbar.tsx`: Navegación actualizada
- `src/app/components/FloatingReportButton.tsx`: Botón de reporte
- `src/app/components/PanicButton.tsx`: Botón de pánico
