# Registro de decisiones

Toda desviación del spec o de un plan, decisión técnica no prevista, o pendiente, se anota aquí. Lo lee la revisión (Opus) al terminar cada plan y lo usa para ajustar los planes siguientes.

Formato:

```
## [Plan NN · Task N] Título corto — YYYY-MM-DD
- **Qué:** qué se hizo distinto o se decidió.
- **Por qué:** motivo concreto.
- **Impacto:** archivos/interfaces afectados y planes siguientes que deben ajustarse (o "ninguno").
- **Estado:** aplicado | pendiente | revertido
```

---

## [Plan 00 · Task 1] Ambiente de test por archivo vía pragma, no `environmentMatchGlobs` — 2026-09-28
- **Qué:** Vitest se configura con `environment: 'node'` por defecto; los archivos `*.test.tsx` que necesiten DOM agregan `// @vitest-environment jsdom` como primera línea.
- **Por qué:** Vitest 5 (instalado por el plan) eliminó la opción `environmentMatchGlobs` que el plan asumía; `pnpm build` falla el type-check con ese campo.
- **Impacto:** `vitest.config.ts`. Todo `*.test.tsx` futuro (Task 6 en adelante) debe llevar el pragma `// @vitest-environment jsdom` en la primera línea del archivo.
- **Estado:** aplicado

## [Plan 00 · Task 4] `agentRules: false` en next.config.ts — 2026-09-28
- **Qué:** se agrega `agentRules: false` a `next.config.ts`. Next.js 16 trae una función que reescribe `CLAUDE.md` en cada `next dev`/`next build`, agregando un bloque `<!-- BEGIN:nextjs-agent-rules -->` con avisos genéricos para agentes de IA sobre cambios de la versión.
- **Por qué:** este proyecto ya tiene un `CLAUDE.md` con reglas propias del proyecto (spec, arquitectura, convenciones); dejar que Next lo reescriba en cada arranque ensucia el diff y mezcla contenido no controlado por el equipo con las reglas del proyecto.
- **Impacto:** `next.config.ts`. Ninguno en planes siguientes.
- **Estado:** aplicado

## [Plan 00 · Task 4] `testTimeout` global subido a 15 s en Vitest — 2026-09-28
- **Qué:** `vitest.config.ts` fija `test.testTimeout: 15000` (antes el default de 5000 ms).
- **Por qué:** con más de un archivo de test usando `createTestDb()` (PGlite/WASM), correr la suite completa en paralelo genera contención de CPU; cada test aislado tarda ~1-3 s pero bajo carga puede superar los 5 s del default y fallar por timeout, no por lógica incorrecta.
- **Impacto:** `vitest.config.ts`. Todo test de integración con PGlite en los planes siguientes se beneficia del mismo margen; no requiere configurarlo por archivo.
- **Estado:** aplicado

## [Plan 00 · Task 4] Tablas de Better Auth escritas a mano, no con `@better-auth/cli generate` — 2026-09-28
- **Qué:** `src/db/schema/auth.ts` define `user`, `session`, `account`, `verification` manualmente en Drizzle, siguiendo el esquema estándar documentado de Better Auth, en vez de generarlas con `@better-auth/cli generate`.
- **Por qué:** el paquete `@better-auth/cli` publicado (1.4.21) está marcado deprecated y va un major por detrás de `better-auth` (1.7.6) instalado; generar el esquema con una CLI desalineada es más riesgoso que escribir las cuatro tablas estándar (estables entre versiones) a mano.
- **Impacto:** `src/db/schema/auth.ts`. Ningún plan siguiente depende del mecanismo de generación, solo de las tablas resultantes.
- **Estado:** aplicado
