import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 reescribe CLAUDE.md en cada `next dev` con su propio aviso para
  // agentes de IA; este proyecto ya tiene su CLAUDE.md con reglas propias.
  agentRules: false,
  // Los e2e compilan en su propia carpeta para poder correr con `pnpm dev` abierto
  // (Next no permite dos servidores de desarrollo sobre el mismo `.next`).
  distDir: process.env.E2E_DIST_DIR ?? ".next",
};

export default nextConfig;
