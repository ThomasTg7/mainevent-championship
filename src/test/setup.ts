import "@testing-library/jest-dom/vitest";

// `@/db` exige DATABASE_URL al importarse (falla rápido en producción si
// falta). postgres.js no conecta hasta la primera consulta, así que un
// valor de relleno alcanza para que los tests puedan importar módulos que
// re-exportan `db` a nivel de módulo sin tocar una base real.
process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5432/guerra_campal_test_placeholder";
