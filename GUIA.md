# Guía rápida de muak

## 1. Cambiar los panoramas de la ruleta

Los panoramas viven en la base de datos. Tienes dos formas de editarlos.

### Opción A — Prisma Studio (rápido, sin código)

```bash
cd apps/api
npm run prisma:studio
```

Se abre en el navegador. Entra a la tabla **`date_plans`** y ahí puedes:

- **Agregar** un panorama (botón _Add record_).
- **Editar** título, descripción, emoji, categoría o peso.
- **Ocultar** uno sin borrarlo: pon `isActive` en `false` (recomendado para no perder el historial).

Campos:

| Campo | Qué es |
| --- | --- |
| `title` | Nombre visible (máx. 80) |
| `description` | Texto del resultado (máx. 240) |
| `emoji` | Emoji del segmento |
| `category` | `FOOD`, `ADVENTURE`, `RELAX`, `HOME`, `SURPRISE` u `OTHER` |
| `weight` | Probabilidad (entero **1 a 100**; más alto = sale más seguido) |
| `isActive` | `true` aparece en la ruleta, `false` no |

> Se necesitan **al menos 2 panoramas activos** para poder girar. Los cambios se ven al recargar la página.

### Opción B — Editar el seed (para los datos iniciales)

Edita la lista en [apps/api/prisma/seed.ts](apps/api/prisma/seed.ts) y ejecuta:

```bash
cd apps/api
npm run prisma:seed
```

Es idempotente: no duplica panoramas existentes (busca por título).

---

## 2. Despliegue

Arquitectura: **Vercel** (frontend) → hace proxy de `/api` → **Render** (backend) → **PostgreSQL** administrado.

### Paso 1 — Base de datos (Render o Neon)

Crea un PostgreSQL administrado y copia su **`DATABASE_URL`** de producción.

### Paso 2 — Backend en Render (Web Service)

- **Root Directory:** `apps/api`
- **Build Command:**
  ```bash
  npm ci && npm run prisma:generate && npm run build && npm run prisma:deploy
  ```
- **Start Command:**
  ```bash
  npm run start:prod
  ```
- **Variables de entorno:**
  | Variable | Valor |
  | --- | --- |
  | `NODE_ENV` | `production` |
  | `DATABASE_URL` | la de producción del paso 1 |
  | `FRONTEND_URL` | tu dominio final, ej. `https://tudominio.com` |

  (`PORT` lo inyecta Render automáticamente.)

- **Seed inicial** (una sola vez, desde la Shell de Render):
  ```bash
  npm run prisma:seed
  ```

Anota la URL pública del servicio, ej. `https://muak-api.onrender.com`.

### Paso 3 — Frontend en Vercel

1. En [apps/web/vercel.json](apps/web/vercel.json), reemplaza el placeholder por la URL real de Render:
   ```json
   "destination": "https://muak-api.onrender.com/api/:path*"
   ```
2. Importa el repo en Vercel con **Root Directory: `apps/web`** (el resto lo define `vercel.json`).
3. Deploy.

### Paso 4 — Tu dominio

- En Vercel → **Settings → Domains** → agrega tu dominio y sigue las instrucciones DNS.
- Asegúrate de que `FRONTEND_URL` en Render sea **exactamente** ese dominio (con `https://`, sin `/` al final), para que CORS funcione.

> Nota: en el plan gratuito de Render el backend "duerme" tras inactividad; el primer giro del día puede tardar ~30-50 s en despertar.

---

## Comandos útiles (local)

```bash
docker compose up -d                 # Base de datos
cd apps/api && npm run start:dev     # API  → http://localhost:3000/api
cd apps/web && npm start             # Web  → http://localhost:4200
```
