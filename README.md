# muak 🌄

Una pequeña app romántica para responder la gran pregunta: **¿Qué hacemos hoy, Catita?**

Catalina entra, gira una ruleta de panoramas y la montaña decide la próxima cita. El resultado lo elige el backend con selección ponderada criptográficamente segura y queda registrado en la base de datos como historial de giros.

## Captura

![muak — ¿Qué hacemos hoy, Catita?](docs/screenshot.png)

> _Espacio reservado: agregar captura en `docs/screenshot.png`._

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Angular 22 (standalone, zoneless, signals, SCSS, Vitest) |
| Backend | NestJS 11 (TypeScript, class-validator, Swagger) |
| ORM | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Base de datos | PostgreSQL 17 (Docker Compose en local) |
| Aleatoriedad | `randomInt` de `node:crypto` (solo backend) |

## Requisitos

- Node.js 22+ (desarrollado con Node 24).
- npm 10+.
- Docker Desktop (para PostgreSQL local).

## Instalación

```bash
# 1. Levantar PostgreSQL
docker compose up -d

# 2. Backend
cd apps/api
npm install
copy .env.example .env   # (cp en macOS/Linux) y ajustar si es necesario
npm run prisma:generate
npm run prisma:migrate   # aplica migraciones en local
npm run prisma:seed      # crea los 8 panoramas iniciales (idempotente)

# 3. Frontend
cd ../web
npm install
```

## Variables de entorno

Solo el backend usa `.env` (ver [apps/api/.env.example](apps/api/.env.example)). **Nunca versionar `.env`.**

| Variable | Descripción | Default |
| --- | --- | --- |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `PORT` | Puerto HTTP de la API | `3000` |
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://catita:catita_local_password@localhost:5433/muak?schema=public` |
| `FRONTEND_URL` | Origen permitido para CORS | `http://localhost:4200` |
| `RECENT_SPINS_DEFAULT_LIMIT` | Límite por defecto de `GET /api/spins/recent` | `10` |
| `RECENT_SPINS_MAX_LIMIT` | Límite máximo de `GET /api/spins/recent` | `50` |

> El contenedor local publica PostgreSQL en el puerto **5433** para no chocar con instalaciones locales en 5432.

El frontend usa archivos de entorno de Angular ([environment.development.ts](apps/web/src/environments/environment.development.ts) apunta a `http://localhost:3000/api`; producción usa `/api`).

## Comandos de desarrollo

```bash
# API (apps/api) — http://localhost:3000/api, Swagger en /docs
npm run start:dev

# Web (apps/web) — http://localhost:4200
npm start
```

## Migraciones

```bash
cd apps/api
npm run prisma:migrate    # desarrollo: crea/aplica migraciones (prisma migrate dev)
npm run prisma:deploy     # producción: solo aplica (prisma migrate deploy)
npm run prisma:studio     # inspección visual de datos
```

Nunca ejecutar `prisma migrate dev` en producción.

## Seed

```bash
cd apps/api
npm run prisma:seed
```

Idempotente: busca cada panorama por título y solo crea los que faltan.

## Pruebas

```bash
# Backend (apps/api)
npm test          # unitarias (Jest) — selección ponderada, planes, validaciones
npm run test:e2e  # e2e (supertest contra la app real, requiere la BD levantada)

# Frontend (apps/web)
npm test          # Vitest — rotación de la ruleta, página, estados de error
```

## Lint

```bash
cd apps/api && npm run lint
cd apps/web && npm run lint   # angular-eslint
```

## Build

```bash
cd apps/api && npm run build   # dist/
cd apps/web && npm run build   # dist/web/browser/
```

## Despliegue

### Frontend (Vercel)

- Build: `npm run build` en `apps/web`; salida en `dist/web/browser`.
- Configurar la URL pública de la API (reemplazo de environment o rewrite de `/api` hacia el backend).
- Configurar fallback de rutas hacia `index.html`.

### Backend (Render)

```bash
# Build
npm ci
npm run prisma:generate
npm run build
npm run prisma:deploy

# Start
npm run start:prod
```

Variables: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `FRONTEND_URL`. La API escucha en `0.0.0.0` y respeta el puerto del proveedor. Swagger se desactiva en producción.

### PostgreSQL

Render PostgreSQL, Neon u otro PostgreSQL administrado. Usar una `DATABASE_URL` de producción distinta a la local y aplicar migraciones solo con `prisma migrate deploy`.

## Estructura principal

```
.
├── docker-compose.yml          # PostgreSQL 17 local (puerto 5433)
├── apps/
│   ├── api/                    # NestJS
│   │   ├── prisma/             # schema.prisma, migraciones, seed.ts
│   │   └── src/
│   │       ├── config/         # validación de variables de entorno
│   │       ├── prisma/         # PrismaService (adapter pg)
│   │       ├── health/         # GET /api/health
│   │       ├── plans/          # GET /api/plans
│   │       ├── spins/          # POST /api/spins, GET /api/spins/recent
│   │       └── common/filters/ # filtro global de excepciones
│   └── web/                    # Angular
│       └── src/app/
│           ├── core/           # modelos, servicios HTTP, textos UI
│           └── features/date-wheel/
│               ├── pages/      # página principal
│               ├── components/ # ruleta SVG, tarjeta de resultado, fondo de montañas
│               └── utils/      # cálculo de rotación (testeado)
└── AGENT_INSTRUCTIONS.md       # especificación original
```

## Decisiones técnicas relevantes

- **El backend decide el resultado.** `POST /api/spins` hace la selección ponderada con `randomInt` de `node:crypto`; el frontend solo anima la ruleta hasta el segmento retornado. El body del POST rechaza campos extra (`forbidNonWhitelisted`) para impedir forzar un panorama.
- **Rotación determinista.** `computeWheelRotation` acumula vueltas completas y siempre avanza hacia adelante hasta dejar el centro del segmento ganador bajo el puntero superior. Lógica pura y testeada.
- **Zoneless + signals.** La página usa señales y `OnPush`; el resultado se revela en `transitionend` de la animación (con fallback de movimiento reducido a 0.6s).
- **Prisma 7 con adapter pg.** Generador `prisma-client` con `moduleFormat = "cjs"` e `importFileExtension = ""` para compatibilidad con el runtime CJS de Nest/ts-node.
- **Accesibilidad.** Resultado anunciado por `aria-live`, diálogo con roles ARIA, foco visible y `prefers-reduced-motion` respetado en todas las animaciones (fondo, ruleta, tarjeta).
- **Fondo SVG propio.** Atardecer psicodélico con montañas, sol, luna, estrellas, cometas y honguitos, dibujado a mano en SVG (sin imágenes genéricas).

## Mejoras futuras (no implementadas)

Panel privado de administración, acceso con código secreto o magic link, marcar citas pendientes/realizadas, evitar repetir el último resultado, fotografías y recuerdos, propuestas de panoramas por Catalina, categorías filtrables, fechas especiales, sonidos opcionales, PWA instalable, historial visual de citas y mapa de lugares visitados.
