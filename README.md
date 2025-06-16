
# Claridad - Mapa del Crimen 🔎🗺️

Plataforma de visualización de delitos urbanos en Argentina. Este proyecto tiene el objetivo de mapear incidentes públicos de forma clara y accesible, permitiendo el filtrado por tipo, fecha y zona. Está desarrollado con tecnologías modernas y pensado para escalar a futuro.

---

## 📦 Stack Técnico

- **Next.js** (App Router)
- **Supabase** (Auth + DB)
- **Leaflet** (mapas)
- **TailwindCSS** (UI)
- **Zod**, **Zustand**, **TypeScript**

---

## 📁 Estructura base (resumen útil para el equipo)

src/
├─ app/ → rutas del sistema
├─ components/ → componentes visuales
├─ config/ → claves, constantes, rutas
├─ hooks/ → lógica reactiva (ej: useCrimeData)
├─ services/ → llamadas a APIs externas
├─ utils/ → helpers generales
├─ types/ → tipos compartidos

---

## 👀 Áreas críticas

| Archivo/Carpeta            | Descripción |
|----------------------------|-------------|
| `MapComponent.tsx`         | Mapa principal con render de incidentes |
| `IncidentFilters.tsx`      | Filtros por tipo, fecha, zona |
| `hooks/useCrimeData.ts`    | Hook central que maneja la data cruda |
| `services/incidentServices.ts` | Llamadas a Supabase |
| `config/maps-key.ts`       | Llaves de Mapbox o Leaflet |
| `app/admin/`               | Panel de carga y revisión |

---

## ⚙ Setup rápido

```bash
pnpm install
pnpm dev