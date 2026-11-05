# Mainevent Championship

Sitio web y panel de administración de **Mainevent Championship**, promotora de **Muay Thai y Kickboxing**: eventos con cartelera estilo afiche, resultados, peleadores, rankings por disciplina, noticias y entradas.

Basado en la plataforma de Open Fight Latam / Guerra Campal (Next.js · TypeScript · Postgres + Drizzle · Better Auth · Tailwind). Cambios del rebranding: [`docs/decisions.md`](docs/decisions.md) → «[Mainevent] Rebranding».

## Verlo en tu computador (guía paso a paso)

**Necesitas:** [Node 22](https://nodejs.org), [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`), [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto, y Git.

1. Clona la rama `mainevent-championship` y entra a la carpeta:

   ```bash
   git clone --branch mainevent-championship https://github.com/ThomasTg7/ofl.git mainevent-championship
   cd mainevent-championship
   ```

   *¿Quieres un repositorio propio?* Crea uno vacío en GitHub (por ejemplo `mainevent-championship`) y, dentro de esta carpeta, ejecuta `git remote set-url origin https://github.com/ThomasTg7/mainevent-championship.git` y `git push -u origin mainevent-championship:main`.

2. Crea tu archivo de configuración. Luego abre `.env` y cambia `BETTER_AUTH_SECRET` por cualquier texto largo (32+ caracteres):

   ```bash
   cp .env.example .env
   ```

3. Levanta la base de datos (Postgres en Docker, puerto 5433):

   ```bash
   docker compose up -d
   ```

4. Instala dependencias, crea las tablas y carga el demo de Mainevent (peleadores, Main XXVII con resultados y Main XXVIII: Rebound con su afiche):

   ```bash
   pnpm install --frozen-lockfile
   pnpm db:migrate
   pnpm db:seed
   ```

5. Crea tu usuario administrador:

   ```bash
   pnpm create-admin tu@correo.com "una-clave-segura"
   ```

6. Inicia el sitio:

   ```bash
   pnpm dev --port 3002
   ```

   - Sitio público: <http://localhost:3002>
   - Panel de administración: <http://admin.localhost:3002> (entra con el usuario del paso 5)

**Qué mirar:** la portada (careo Cardenes vs Santos con polvo dorado), la cartelera estilo afiche (botón «Ver datos» en cada pelea), `/eventos/main-xxvii` (resultados), `/eventos/main-xxviii-rebound` (afiche oficial), `/rankings` (Muay Thai) y `/rankings?disciplina=kickboxing`. En el panel: Eventos → Cartelera → editar una pelea para ver «Disciplina» y «Rótulo del afiche».

**Si algo falla:**
- *Puerto 5433 ocupado:* cierra el otro Postgres o cambia el puerto en `docker-compose.yml` y en `DATABASE_URL` de `.env`.
- *Ves datos viejos tras recargar el demo:* detén el servidor, borra la carpeta `.next` y vuelve a ejecutar `pnpm dev --port 3002`.
- *Empezar de cero:* `docker compose down -v`, borra `.storage` y repite desde el paso 3.

## Verificar

```bash
pnpm test        # unitarias e integración (Vitest + PGlite)
pnpm lint
pnpm typecheck
pnpm test:e2e    # Playwright (necesita Docker)
```

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/guia-admin.md`](docs/guia-admin.md) | cómo usar el panel |
| [`docs/deploy.md`](docs/deploy.md) | publicar en Vercel |
| [`docs/vps-migration.md`](docs/vps-migration.md) | pasar a un VPS propio |
| [`docs/convenciones.md`](docs/convenciones.md) · [`docs/decisions.md`](docs/decisions.md) | patrones y registro de decisiones |
| [`CLAUDE.md`](CLAUDE.md) | reglas del proyecto |
