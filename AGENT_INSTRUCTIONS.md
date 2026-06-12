# Instrucciones para construir “muak”

> Documento principal de implementación para un agente de desarrollo en VS Code.
>
> El agente debe leer este archivo completo antes de crear o modificar código y debe privilegiar siempre la solución más simple, mantenible y funcional.

---

## 1. Objetivo del proyecto

Construir una aplicación web romántica, pequeña y responsiva que permita girar una ruleta con panoramas de cita.

La experiencia debe sentirse personalizada para Catalina (“Catita”), con una identidad visual inspirada en montañas, escalada, naturaleza, atardeceres y aventura (escalada es lo más importante jaja).

La aplicación debe:

1. Obtener desde una API los panoramas activos.
2. Mostrar los panoramas en una ruleta visual.
3. Permitir girar la ruleta una sola vez por interacción.
4. Solicitar al backend el panorama ganador.
5. Animar la ruleta hasta detenerse exactamente en el panorama seleccionado.
6. Mostrar el resultado de manera atractiva.
7. Registrar cada giro en PostgreSQL.

El proyecto es personal y de bajo tráfico. No debe sobrearquitecturarse.

---

## 2. Principios obligatorios

El agente debe respetar estas decisiones durante toda la implementación:

- Usar TypeScript tanto en frontend como en backend.
- Usar Angular para el frontend.
- Usar NestJS para la API REST.
- Usar PostgreSQL como base de datos.
- Usar Prisma ORM para acceso a datos y migraciones.
- Usar npm como gestor de paquetes.
- Usar SCSS puro para estilos.
- Usar componentes standalone en Angular.
- Implementar la ruleta mediante SVG, CSS y TypeScript.
- No utilizar una librería externa de ruleta.
- No utilizar Ionic.
- No utilizar Tailwind, Bootstrap ni Angular Material.
- No implementar SSR.
- No crear microservicios.
- No implementar autenticación ni panel administrativo en el MVP.
- No almacenar secretos en el repositorio.
- No depender de imágenes externas para el fondo principal.
- Crear el paisaje de montaña con SVG y/o CSS para que sea ligero y personalizable.
- Mantener la aplicación preparada para desplegar frontend, backend y base de datos por separado.

Ante una decisión no especificada, elegir la alternativa más simple y mantenible.

---

## 3. Stack objetivo

Usar versiones estables y compatibles entre sí:

- Node.js: `24.15.0` o superior dentro de la rama 24.
- Angular: `22.x`.
- NestJS: versión estable compatible con Node.js 24.
- Prisma ORM: `7.x`.
- PostgreSQL: `17` o superior.
- TypeScript: versión instalada y soportada por cada framework.
- npm: versión incluida con Node.js.

No usar versiones beta, RC, nightly o experimentales.

El archivo `package-lock.json` debe quedar versionado tanto en frontend como en backend.

---

## 4. Alcance del MVP

### Incluido

- Página principal única.
- Fondo personalizado de montañas.
- Ruleta dinámica obtenida desde la API.
- Selección aleatoria realizada por el backend.
- Soporte de pesos o probabilidades por panorama.
- Animación precisa de la ruleta.
- Modal o tarjeta de resultado.
- Botón para volver a girar.
- Persistencia del historial de giros.
- Endpoint opcional para consultar los últimos giros.
- Datos iniciales mediante seed.
- Prisma Studio para administrar panoramas durante el MVP.
- Manejo de estados de carga, error y ausencia de panoramas.
- Diseño mobile-first.
- Configuración para desarrollo local.
- Configuración base para despliegue.

### No incluido

- Registro o inicio de sesión.
- Usuarios.
- Roles.
- Panel administrativo web.
- Notificaciones.
- Pagos.
- Aplicación móvil nativa.
- Chat.
- Edición de panoramas desde el frontend.
- Subida de fotografías.
- Geolocalización.
- Integraciones de terceros.
- Analítica avanzada.

No agregar funcionalidades fuera del MVP sin una instrucción posterior explícita.

---

## 5. Estructura del repositorio

Crear un repositorio simple con frontend y backend separados, sin Nx:

```text
muak/
├── apps/
│   ├── web/                      # Angular
│   └── api/                      # NestJS
├── docker-compose.yml            # PostgreSQL local
├── .gitignore
├── README.md
└── AGENT_INSTRUCTIONS.md
```

Cada aplicación puede mantener su propio `package.json` y `package-lock.json`.

No configurar npm workspaces salvo que exista una necesidad concreta. Para este MVP no son obligatorios.

---

## 6. Creación inicial de los proyectos

Ejecutar desde la raíz del repositorio.

### Frontend

```bash
npx @angular/cli@22 new web \
  --directory apps/web \
  --routing \
  --style=scss \
  --standalone \
  --skip-git \
  --package-manager=npm
```

### Backend

```bash
npx @nestjs/cli@latest new apps/api \
  --package-manager=npm \
  --skip-git
```

Después de crear ambos proyectos:

1. Ejecutar cada aplicación.
2. Confirmar que compilan sin errores.
3. Recién entonces comenzar a agregar funcionalidades.

---

## 7. PostgreSQL local

Crear un `docker-compose.yml` en la raíz:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: muak-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: muak
      POSTGRES_USER: catita
      POSTGRES_PASSWORD: catita_local_password
    ports:
      - "5432:5432"
    volumes:
      - muak_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U catita -d muak"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  muak_postgres_data:
```

Estas credenciales son únicamente para desarrollo local.

Comandos esperados:

```bash
docker compose up -d
docker compose ps
docker compose down
```

No versionar datos ni volúmenes de PostgreSQL.

---

## 8. Variables de entorno

### Backend: `apps/api/.env.example`

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://catita:catita_local_password@localhost:5432/muak?schema=public
FRONTEND_URL=http://localhost:4200
RECENT_SPINS_DEFAULT_LIMIT=10
RECENT_SPINS_MAX_LIMIT=50
```

Crear localmente `apps/api/.env`, pero agregarlo a `.gitignore`.

### Frontend

Crear archivos de environment o una configuración equivalente:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

Para producción, la URL debe ser configurable sin dejar valores locales hardcodeados.

Nunca incluir credenciales de base de datos en Angular.

---

## 9. Modelo de datos

Usar nombres técnicos en inglés y textos visibles en español.

### Prisma schema

Crear al menos estos modelos:

```prisma
enum PlanCategory {
  FOOD
  ADVENTURE
  RELAX
  HOME
  SURPRISE
  OTHER
}

model DatePlan {
  id          String       @id @default(cuid())
  title       String       @db.VarChar(80)
  description String?      @db.VarChar(240)
  emoji       String?      @db.VarChar(16)
  category    PlanCategory @default(OTHER)
  weight      Int          @default(1)
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  spins       Spin[]

  @@index([isActive])
  @@map("date_plans")
}

model Spin {
  id         String   @id @default(cuid())
  datePlanId String
  spunAt     DateTime @default(now())
  datePlan   DatePlan @relation(fields: [datePlanId], references: [id], onDelete: Restrict)

  @@index([spunAt])
  @@index([datePlanId])
  @@map("spins")
}
```

### Reglas de datos

- `weight` debe ser un entero entre 1 y 100.
- Solo los panoramas con `isActive = true` participan.
- Deben existir al menos dos panoramas activos para permitir un giro.
- Un panorama utilizado en el historial no debe eliminarse físicamente.
- Para retirar un panorama se debe usar `isActive = false`.
- El orden entregado por la API debe ser estable, por ejemplo `createdAt ASC`.
- No almacenar colores en la base de datos durante el MVP. El frontend asignará colores según la posición.

---

## 10. Configuración de Prisma 7

Dentro de `apps/api` instalar las dependencias necesarias:

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install --save-dev prisma @types/pg
```

Inicializar Prisma y generar el cliente dentro del backend.

La implementación debe seguir la configuración vigente de Prisma 7:

- Usar el adaptador `@prisma/adapter-pg`.
- Usar PostgreSQL como provider.
- Generar Prisma Client en una carpeta interna del proyecto.
- Crear un `PrismaModule` global.
- Crear un `PrismaService`.
- Cerrar correctamente las conexiones al apagar la aplicación.
- No instanciar múltiples clientes Prisma por request.

Aplicar la primera migración:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Agregar scripts útiles al `package.json` del backend:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "prisma db seed"
  }
}
```

Adaptar la sintaxis exacta al formato generado por la versión instalada de Prisma.

---

## 11. Seed inicial

Crear un seed idempotente. Ejecutarlo varias veces no debe duplicar panoramas.

Usar inicialmente estos panoramas:

| Título | Descripción | Emoji | Categoría | Peso |
|---|---|---:|---|---:|
| Picnic con vista | Preparar algo rico y buscar un lugar bonito para conversar. | 🧺 | ADVENTURE | 1 |
| Cafecito y paseo | Elegir una cafetería y caminar sin apuro. | ☕ | FOOD | 1 |
| Cena casera juntos | Cocinar algo rico entre los dos. | 🍝 | HOME | 1 |
| Mirar el atardecer | Buscar un lugar tranquilo y ver caer el sol. | 🌄 | RELAX | 1 |
| Caminata en la naturaleza | Salir a recorrer un sendero o parque. | 🥾 | ADVENTURE | 1 |
| Noche de películas | Elegir una película, mantita y algo para picar. | 🎬 | HOME | 1 |
| Probar un lugar nuevo | Conocer un restaurante o rincón distinto. | 🗺️ | FOOD | 1 |
| Cita sorpresa | Uno organiza y el otro solo debe dejarse sorprender. | ✨ | SURPRISE | 1 |

Los textos deben ser fáciles de editar posteriormente desde Prisma Studio.

---

## 12. Arquitectura del backend

Organizar NestJS así:

```text
apps/api/src/
├── app.module.ts
├── main.ts
├── common/
│   ├── filters/
│   └── interceptors/
├── config/
│   └── env.validation.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── plans/
│   ├── dto/
│   ├── plans.controller.ts
│   ├── plans.module.ts
│   └── plans.service.ts
└── spins/
    ├── dto/
    ├── spins.controller.ts
    ├── spins.module.ts
    └── spins.service.ts
```

### Configuración global

En `main.ts`:

- Prefijo global: `/api`.
- Puerto desde `PORT`.
- CORS limitado a `FRONTEND_URL`.
- `ValidationPipe` global con:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- Manejo consistente de errores.
- Swagger en `/docs`.
- No exponer stack traces en producción.

Crear validación de variables de entorno. La API debe fallar al iniciar si falta `DATABASE_URL` o contiene un formato inválido.

---

## 13. Contrato de la API

### `GET /api/health`

Respuesta:

```json
{
  "status": "ok"
}
```

Debe permitir comprobar que la API está activa.

### `GET /api/plans`

Devuelve únicamente panoramas activos, en orden estable.

Respuesta:

```json
{
  "data": [
    {
      "id": "plan_id",
      "title": "Picnic con vista",
      "description": "Preparar algo rico y buscar un lugar bonito para conversar.",
      "emoji": "🧺",
      "category": "ADVENTURE",
      "weight": 1
    }
  ]
}
```

No devolver campos internos que el frontend no necesita.

### `POST /api/spins`

No recibe el ID del resultado desde el frontend.

El backend debe:

1. Consultar los panoramas activos.
2. Validar que existan al menos dos.
3. Seleccionar un panorama considerando `weight`.
4. Registrar el giro.
5. Retornar el giro y el panorama ganador.

Respuesta:

```json
{
  "data": {
    "id": "spin_id",
    "spunAt": "2026-06-10T20:00:00.000Z",
    "selectedPlan": {
      "id": "plan_id",
      "title": "Mirar el atardecer",
      "description": "Buscar un lugar tranquilo y ver caer el sol.",
      "emoji": "🌄",
      "category": "RELAX"
    }
  }
}
```

Errores esperados:

- `409 Conflict` si existen menos de dos panoramas activos.
- `500 Internal Server Error` para errores no controlados, sin filtrar información sensible.

### `GET /api/spins/recent?limit=10`

Endpoint secundario.

- `limit` debe ser opcional.
- Debe validar mínimo 1 y máximo 50.
- Debe ordenar por `spunAt DESC`.
- Debe incluir información básica del panorama.

---

## 14. Selección ponderada

La selección se realiza exclusivamente en el backend.

No usar `Math.random()` para decidir el resultado. Utilizar `randomInt` del módulo nativo `node:crypto`.

Algoritmo:

1. Calcular la suma de todos los pesos.
2. Generar un entero aleatorio entre `0` y `totalWeight - 1`.
3. Recorrer los panoramas acumulando sus pesos.
4. Seleccionar el primero cuyo acumulado supere el número generado.
5. Registrar ese resultado.

Ejemplo:

```ts
const totalWeight = plans.reduce((sum, plan) => sum + plan.weight, 0);
const value = randomInt(totalWeight);

let accumulated = 0;

for (const plan of plans) {
  accumulated += plan.weight;

  if (value < accumulated) {
    return plan;
  }
}
```

Validar los pesos antes de realizar la selección.

Crear pruebas unitarias para este servicio, incluyendo:

- Dos o más panoramas válidos.
- Solo un panorama activo.
- Ningún panorama activo.
- Pesos diferentes.
- Peso inválido.
- Registro correcto del giro.

---

## 15. Arquitectura del frontend

Organizar Angular de manera sencilla:

```text
apps/web/src/app/
├── app.component.ts
├── app.config.ts
├── app.routes.ts
├── core/
│   ├── models/
│   │   ├── date-plan.model.ts
│   │   └── spin.model.ts
│   └── services/
│       ├── plans-api.service.ts
│       └── spins-api.service.ts
├── features/
│   └── date-wheel/
│       ├── pages/
│       │   └── date-wheel-page/
│       └── components/
│           ├── mountain-background/
│           ├── result-card/
│           └── wheel/
└── shared/
    └── components/
        ├── loading-state/
        └── error-state/
```

No crear capas o abstracciones que no aporten valor al MVP.

### Estado

Usar signals de Angular para manejar:

- Panoramas.
- Estado de carga inicial.
- Estado de giro.
- Resultado seleccionado.
- Error.
- Rotación actual de la ruleta.

No agregar NgRx.

### HTTP

Configurar `HttpClient` mediante providers modernos.

Centralizar las llamadas HTTP en servicios.

No llamar directamente a la API desde componentes visuales.

---

## 16. Diseño visual

La interfaz debe ser romántica, cálida y relacionada con la montaña, pero no infantil ni excesivamente recargada.

### Textos iniciales

Título:

```text
¿Qué hacemos hoy, Catita?
```

Subtítulo:

```text
Gira la ruleta y deja que la montaña decida 🌄
```

Botón principal:

```text
Girar la ruleta
```

Título del resultado:

```text
¡Nuestra próxima cita será...!
```

Botón posterior:

```text
Girar otra vez
```

Los textos deben quedar centralizados en una constante o archivo de configuración para facilitar su edición.

### Paleta sugerida

Crear variables CSS:

```scss
:root {
  --color-pine: #234536;
  --color-sage: #8fae94;
  --color-cream: #fff6e8;
  --color-sunset: #d8875f;
  --color-sky: #bfd7de;
  --color-night: #26344a;
  --color-text: #26332d;
  --color-white: #ffffff;
}
```

La ruleta puede alternar colores derivados de esta paleta.

### Fondo

Construir un fondo propio con:

- Cielo mediante degradado CSS.
- Dos o tres capas SVG de montañas.
- Profundidad mediante tonos diferentes.
- Sol o luna opcional.
- Nubes muy sutiles.
- Animación lenta y discreta solo si no afecta rendimiento.

No descargar una fotografía genérica de montaña.

### Estilo

- Bordes redondeados.
- Sombras suaves.
- Tipografía legible.
- Mucho espacio visual.
- Contraste suficiente.
- Animaciones suaves.
- Evitar corazones excesivos.
- Evitar saturar la pantalla con decoraciones.

Se puede usar una fuente web únicamente si existe fallback local y la aplicación sigue funcionando cuando la fuente externa no carga.

---

## 17. Implementación de la ruleta

La ruleta debe construirse como SVG.

### Requisitos

- Cantidad dinámica de segmentos.
- Un segmento por panorama.
- Texto o emoji visible en cada segmento.
- Puntero fijo en la parte superior.
- Tamaño adaptable al viewport.
- Botón separado del SVG.
- El botón debe deshabilitarse durante el giro.
- No debe ser posible iniciar dos giros simultáneos.
- La animación debe finalizar exactamente en el panorama elegido por la API.
- La duración recomendada es entre 4 y 6 segundos.
- Debe realizar al menos 5 vueltas completas antes de detenerse.
- Usar una curva de desaceleración natural.
- Mantener la rotación acumulada entre giros para evitar saltos visuales.

### Flujo del giro

1. El usuario pulsa “Girar la ruleta”.
2. El frontend deshabilita el botón.
3. El frontend llama `POST /api/spins`.
4. La API retorna el panorama ganador.
5. El frontend localiza el índice del panorama dentro del arreglo mostrado.
6. Calcula el ángulo final.
7. Ejecuta la animación.
8. Al finalizar la transición, muestra la tarjeta de resultado.
9. Rehabilita la interacción.

No mostrar el resultado antes de que termine la animación.

### Cálculo

Para `n` panoramas:

```text
segmentAngle = 360 / n
```

La aplicación debe considerar:

- La orientación inicial del SVG.
- La posición fija del puntero.
- El centro angular de cada segmento.
- La rotación ya acumulada.
- Las vueltas completas adicionales.
- La normalización del ángulo entre 0 y 360.

Crear una función pura y testeable para calcular la rotación final.

La función debe recibir al menos:

```ts
interface RotationInput {
  itemCount: number;
  selectedIndex: number;
  currentRotation: number;
  extraTurns: number;
}
```

Y retornar la nueva rotación absoluta.

---

## 18. Comportamiento responsivo

Diseñar mobile-first.

### Móvil

- La ruleta debe ocupar la mayor parte del ancho disponible.
- Botón suficientemente grande para tocarlo con facilidad.
- Textos de segmentos abreviados cuando sea necesario.
- La tarjeta de resultado no debe salirse del viewport.
- No debe existir scroll horizontal.

### Escritorio

- Contenido centrado.
- Ancho máximo razonable.
- Fondo de montaña visible sin competir con la ruleta.
- Ruleta de tamaño máximo limitado para no ocupar toda la pantalla.

Probar al menos estos anchos:

- 360 px.
- 390 px.
- 768 px.
- 1280 px.
- 1920 px.

---

## 19. Accesibilidad

Implementar como mínimo:

- Botones reales con `<button>`.
- Estados `disabled`.
- Texto alternativo o descripción para el SVG.
- `aria-live="polite"` para anunciar el resultado.
- Foco visible.
- Navegación por teclado.
- Contraste legible.
- No depender solo del color para comunicar el resultado.
- Respetar `prefers-reduced-motion`.

Cuando el usuario prefiera movimiento reducido:

- Acortar significativamente la animación.
- Mantener visible el resultado.
- No eliminar la funcionalidad.

---

## 20. Manejo de errores

### Frontend

Mostrar mensajes amistosos:

Carga inicial:

```text
Preparando nuestros panoramas...
```

API no disponible:

```text
No pude cargar la ruleta. Intentemos nuevamente.
```

Menos de dos panoramas:

```text
Necesitamos al menos dos panoramas para girar la ruleta.
```

Error durante el giro:

```text
La montaña se distrajo un poquito. Probemos otra vez.
```

Agregar un botón “Reintentar” cuando corresponda.

No mostrar errores técnicos, URLs internas ni stack traces al usuario.

### Backend

- Usar excepciones HTTP de NestJS.
- Registrar errores útiles en consola.
- No registrar secretos.
- No retornar detalles internos de Prisma.
- Mantener una forma de respuesta consistente.

---

## 21. Pruebas mínimas

### Backend

Crear pruebas unitarias para:

- Selección ponderada.
- Validación de cantidad mínima.
- Consulta de panoramas activos.
- Límite de giros recientes.

Crear pruebas e2e para:

- `GET /api/health`.
- `GET /api/plans`.
- `POST /api/spins`.
- Error de giro con menos de dos panoramas.

### Frontend

Crear pruebas para:

- Cálculo del ángulo final.
- Identificación del índice seleccionado.
- Deshabilitación del botón durante el giro.
- Manejo de error de API.
- Visualización del resultado al finalizar la animación.

No intentar alcanzar cobertura artificial del 100 %. Probar la lógica crítica.

---

## 22. Calidad del código

Requisitos:

- TypeScript en modo estricto.
- Sin uso innecesario de `any`.
- Métodos pequeños y con responsabilidad clara.
- Nombres técnicos en inglés.
- Textos visibles en español.
- DTOs para entradas y salidas relevantes.
- Validación con `class-validator` en el backend.
- No duplicar interfaces sin necesidad.
- No dejar código comentado.
- No dejar `console.log` de depuración.
- No dejar TODOs sin resolver.
- Ejecutar formatter y linter.
- Ejecutar build antes de considerar una fase terminada.

No crear patrones genéricos, repositorios o factories si solo serán usados una vez.

---

## 23. Seguridad básica

Aunque sea un proyecto personal:

- Configurar CORS con una URL explícita.
- Validar todas las entradas.
- Usar variables de entorno.
- No exponer `DATABASE_URL`.
- No incluir `.env` en Git.
- No construir SQL manual con valores del usuario.
- Limitar el parámetro `limit`.
- No aceptar pesos ni IDs seleccionados desde `POST /spins`.
- No habilitar endpoints de escritura de panoramas en el MVP.
- Deshabilitar o proteger Swagger en producción si se considera necesario.
- Mantener dependencias actualizadas y sin vulnerabilidades críticas conocidas.

---

## 24. Desarrollo local

Orden recomendado:

### Terminal 1: base de datos

```bash
docker compose up -d
```

### Terminal 2: backend

```bash
cd apps/api
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

API esperada:

```text
http://localhost:3000/api
```

Swagger esperado:

```text
http://localhost:3000/docs
```

### Terminal 3: frontend

```bash
cd apps/web
npm install
npm start
```

Frontend esperado:

```text
http://localhost:4200
```

---

## 25. Scripts esperados

### Backend

El backend debe contar al menos con:

```bash
npm run start:dev
npm run build
npm run start:prod
npm run lint
npm test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

### Frontend

El frontend debe contar al menos con:

```bash
npm start
npm run build
npm test
npm run lint
```

Si Angular no genera lint por defecto, configurar ESLint con la integración oficial correspondiente y sin reglas innecesariamente restrictivas.

---

## 26. Despliegue objetivo

### Frontend

Destino sugerido: Vercel.

Requisitos:

- Build de producción de Angular.
- Configurar la variable o archivo de entorno con la URL pública de la API.
- Confirmar la carpeta real de salida en `angular.json`.
- Configurar fallback hacia `index.html` para rutas del frontend.
- No desplegar archivos `.env` con secretos.

### Backend

Destino sugerido: Render.

Build recomendado:

```bash
npm ci
npm run prisma:generate
npm run build
npm run prisma:deploy
```

Inicio:

```bash
npm run start:prod
```

Configurar:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `FRONTEND_URL`

El backend debe escuchar en `0.0.0.0` y usar el puerto proporcionado por el proveedor.

### PostgreSQL

Destino posible:

- Render PostgreSQL.
- Neon PostgreSQL.
- Otro PostgreSQL administrado compatible.

Usar una URL de conexión de producción diferente a la local.

Nunca ejecutar `prisma migrate dev` en producción. Usar:

```bash
npx prisma migrate deploy
```

---

## 27. README final

Además de esta guía, crear un `README.md` orientado a una persona desarrolladora.

Debe contener:

- Descripción.
- Captura o espacio reservado para captura.
- Stack.
- Requisitos.
- Instalación.
- Variables de entorno.
- Comandos de desarrollo.
- Migraciones.
- Seed.
- Pruebas.
- Build.
- Despliegue.
- Estructura principal.
- Decisiones técnicas relevantes.

Mantener el README sincronizado con la implementación real.

---

## 28. Orden obligatorio de implementación

El agente debe trabajar en este orden:

### Fase 1: scaffolding

- Crear estructura.
- Crear Angular.
- Crear NestJS.
- Crear PostgreSQL local.
- Confirmar que ambos proyectos compilan.

### Fase 2: persistencia

- Configurar variables de entorno.
- Configurar Prisma.
- Crear modelos.
- Crear migración.
- Crear seed.
- Verificar datos con Prisma Studio.

### Fase 3: API

- Health check.
- Módulo de panoramas.
- Módulo de giros.
- Selección ponderada.
- Registro de giro.
- Validaciones.
- Swagger.
- Pruebas.

### Fase 4: frontend funcional

- Modelos.
- Servicios HTTP.
- Carga de panoramas.
- Estados de carga y error.
- SVG de ruleta.
- Petición de giro.
- Cálculo de rotación.
- Resultado.

### Fase 5: diseño

- Fondo de montañas.
- Paleta.
- Tipografía.
- Animaciones.
- Responsive.
- Accesibilidad.
- Movimiento reducido.

### Fase 6: cierre

- Pruebas completas.
- Lint.
- Builds de producción.
- Revisión de variables.
- README.
- Configuración de despliegue.

No comenzar una fase sin que la anterior compile y funcione.

---

## 29. Checklist de aceptación

El MVP se considera terminado únicamente cuando:

- [ ] `docker compose up -d` inicia PostgreSQL correctamente.
- [ ] Las migraciones se ejecutan desde cero.
- [ ] El seed crea los panoramas sin duplicarlos.
- [ ] `GET /api/health` responde correctamente.
- [ ] `GET /api/plans` devuelve los panoramas activos.
- [ ] `POST /api/spins` selecciona y registra un panorama.
- [ ] La selección considera los pesos.
- [ ] El frontend carga la información desde la API.
- [ ] La ruleta tiene un segmento por panorama.
- [ ] La ruleta se detiene en el resultado retornado por el backend.
- [ ] No se pueden realizar dos giros simultáneos.
- [ ] El resultado aparece después de finalizar la animación.
- [ ] Los errores se muestran de forma comprensible.
- [ ] La interfaz funciona correctamente en móvil y escritorio.
- [ ] La interfaz respeta movimiento reducido.
- [ ] No existen secretos versionados.
- [ ] No existen errores de TypeScript.
- [ ] No existen errores de lint.
- [ ] Las pruebas críticas pasan.
- [ ] El frontend genera build de producción.
- [ ] El backend genera build de producción.
- [ ] El README explica cómo ejecutar el proyecto desde cero.

---

## 30. Mejoras futuras permitidas, pero no implementar ahora

Registrar estas ideas únicamente en la documentación:

- Panel privado para administrar panoramas.
- Acceso mediante código secreto o magic link.
- Marcar citas como pendientes o realizadas.
- Evitar temporalmente que se repita el último resultado.
- Agregar fotografías y recuerdos.
- Permitir que Catalina proponga panoramas.
- Categorías filtrables.
- Fechas especiales.
- Sonidos opcionales.
- PWA instalable.
- Historial visual de citas.
- Mapa de lugares visitados.

No anticipar estas funciones en la arquitectura del MVP salvo que no agreguen complejidad.

---

## 31. Reglas finales para el agente

1. Leer este documento completo antes de comenzar.
2. No cambiar el stack.
3. No ampliar el alcance.
4. No introducir dependencias sin justificar su necesidad.
5. No omitir validaciones para avanzar más rápido.
6. No simular datos una vez que la API esté disponible.
7. No decidir el resultado en el frontend.
8. No usar una imagen genérica como fondo.
9. No dejar la ruleta con una animación aproximada: debe aterrizar en el resultado correcto.
10. Ejecutar pruebas, lint y build después de cambios estructurales.
11. Resolver errores antes de continuar.
12. Mantener el código pequeño y legible.
13. Documentar cualquier desviación imprescindible.
14. Priorizar una experiencia bonita, rápida y emocional por sobre agregar funciones.
15. Entregar una aplicación completamente ejecutable, no solo archivos de ejemplo.

---

## Resultado esperado

Al abrir la página, Catalina debe ver una experiencia personalizada con un paisaje de montaña, el mensaje “¿Qué hacemos hoy, Catita?” y una ruleta con panoramas.

Al pulsar el botón, la ruleta debe girar suavemente, detenerse en el panorama elegido por la API y mostrar la próxima cita de una manera entretenida, cálida y especial.
