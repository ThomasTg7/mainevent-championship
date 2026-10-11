# OFL — copia independiente de Guerra Campal

Creada el 11 de octubre de 2026 desde la carpeta local GuerraCampal. Conserva frontend, backend, panel, código, historial Git, documentación, migraciones, pruebas y archivos locales de imágenes. El diseño público y del panel corresponde a Open Fight Latam. Los datos y fotos de Guerra Campal se conservan como contenido heredado de vista previa.

## Usar la copia

Desde esta carpeta:

```powershell
docker compose up -d
pnpm install --frozen-lockfile
pnpm dev --port 3002
```

- Sitio: http://localhost:3002
- Panel: http://admin.localhost:3002
- Postgres propio: puerto 5433, base `ofl`, volumen `ofl_postgres-data`.
- Pruebas de navegador: base separada `ofl_e2e` en el mismo Postgres de OFL.
- Fotos: `.storage/`, incluidos originales y variantes; recursos públicos: `public/`.

La base inicial fue restaurada desde la base local `guerra_campal`: 13 peleadores, 5 eventos, 10 noticias y 31 registros de medios. Los usuarios existentes se conservan; los secretos de autenticación de OFL son nuevos, por lo que hay que volver a iniciar sesión.

No ejecutar `pnpm db:seed` sobre esta base: ya contiene la copia de los datos.

## Respaldo y configuración

`deploy/backups/db/guerra-campal-20261011.dump` contiene el respaldo inicial completo de la base local, incluidas las migraciones. Para restaurarlo en una base vacía de OFL:

```powershell
docker compose up -d
docker compose cp deploy/backups/db/guerra-campal-20261011.dump postgres:/tmp/ofl-initial.dump
docker compose exec -T postgres pg_restore --exit-on-error --no-owner --no-privileges -U postgres -d ofl /tmp/ofl-initial.dump
```

Las configuraciones originales `.env`, `.env.demo` y `.env.vercel` están preservadas en `deploy/backups/source-config/`, excluido de Git. Son respaldos privados: algunas apuntan a servicios de Guerra Campal. OFL usa exclusivamente el nuevo `.env` local, su propia base y sus fotos locales; correo en consola y Google sin configurar.

Esta copia no incluye una exportación de la base remota de demostración ni del bucket remoto: conserva las configuraciones para localizarlos, pero los datos restaurados y las fotos verificadas son los de la instalación local.

El historial Git se conserva en la rama `codex/ofl-copy`; se retiró `origin`. Para publicar OFL, configurar un repositorio, dominios y servicios propios. Las guías heredadas de despliegue mantienen referencias a Guerra Campal y se deben adaptar antes de utilizarlas.

## Cambiar la promotora

La identidad se define en `src/domain/brand.ts` y en el spec aprobado `docs/superpowers/specs/2026-10-11-ofl-redesign-design.md`. El logo suministrado, negro/blanco, rojo y violeta se aplican a todo el sitio y al panel. Los contenidos, afiches, nombres de eventos y redes guardadas siguen siendo los de la copia; se pueden sustituir desde el panel cuando estén disponibles los de OFL. El enlace oficial de Instagram de OFL aparece por separado.

Rama de trabajo del rediseño: `codex/ofl-redesign`. Las reglas funcionales heredadas siguen vigentes; la estética OFL sustituye la paleta amarilla y la maqueta antigua.
