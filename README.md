# Flauer

Un diario personal de poemas. Cada poema pertenece a un día y aparece como una flor en el
calendario. La lectura es pública; solo la persona dueña del diario puede escribir.

Hecho con Next.js (App Router, Server Components, Server Actions), Neon Postgres, Drizzle
ORM, Zod, `jose` y Tailwind CSS.

## Rutas

| Ruta                 | Qué hace                                                    |
| -------------------- | ----------------------------------------------------------- |
| `/`                  | Calendario del mes actual. `?mes=2026-10` muestra otro mes. |
| `/dia/AAAA-MM-DD`    | Poemas de ese día.                                          |
| `/poema/[id]`        | Leer un poema.                                              |
| `/escribir?fecha=…`  | Nuevo poema (solo con sesión). Sin fecha usa hoy.           |
| `/poema/[id]/editar` | Editar un poema (solo con sesión).                          |
| `/entrar`, `/salir`  | Abrir y cerrar sesión. No hay ningún link visible.          |

"Hoy" siempre se calcula en `America/Caracas` (`ZONA_HORARIA` en `src/lib/config.ts`).
Ahí mismo se configuran el nombre de la app, el subtítulo y la firma opcional de los
poemas.

## Variables de entorno

| Variable         | Para qué                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`   | Conexión a Neon Postgres. En Vercel la inyecta la integración de Neon. |
| `OWNER_PASSWORD` | Contraseña de `/entrar`.                                               |
| `AUTH_SECRET`    | Secreto para firmar la cookie de sesión. Mínimo 32 caracteres.         |

Copia `.env.example` como `.env.local` y complétalo. `.env.local` está en `.gitignore`:
nunca subas secretos al repo. Para generar `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Correr en local

Requiere Node 22.12 o superior (ver `.nvmrc`) y pnpm.

```bash
pnpm install
cp .env.example .env.local   # y completa los valores
pnpm db:migrate              # crea las tablas
pnpm db:seed                 # opcional: ~10 poemas de ejemplo
pnpm dev
```

Para desarrollo conviene usar una **rama de Neon** propia en vez de la base de producción
(en la consola de Neon: _Branches → New branch_) y poner su cadena de conexión en
`.env.local`.

`pnpm db:seed` es solo para desarrollo: se niega a correr con `NODE_ENV=production`, dentro
de Vercel o sobre una base que ya tenga poemas.

Otros scripts:

```bash
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm build         # build de producción
pnpm db:studio     # explorar la base con Drizzle Studio
```

## Migraciones

El esquema vive en `src/db/schema.ts` y las migraciones versionadas en `drizzle/`.

```bash
# Después de cambiar el esquema: genera una migración nueva y súbela al repo
pnpm db:generate --name describe-el-cambio

# Aplica las migraciones pendientes a la base de DATABASE_URL
pnpm db:migrate
```

## Desplegar en Vercel

1. Importa el repo en Vercel (framework: Next.js; se detecta pnpm por el lockfile).
2. En el proyecto: _Storage_ → _Create Database_ → **Neon** (Marketplace) y conéctala al
   proyecto. Esto inyecta `DATABASE_URL` en los entornos.
3. En _Settings → Environment Variables_ agrega `OWNER_PASSWORD` y `AUTH_SECRET`.
4. Aplica las migraciones a la base de producción desde tu máquina:

   ```bash
   pnpm dlx vercel link
   pnpm dlx vercel env pull .env.local --environment=production
   pnpm db:migrate
   ```

5. Redespliega. Para escribir, entra en `https://tu-dominio/entrar`.

Cada cambio de esquema futuro: `pnpm db:generate`, commit, y `pnpm db:migrate` contra la
base de producción antes (o justo después) de desplegar.
