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
