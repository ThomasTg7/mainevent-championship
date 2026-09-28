import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 reescribe CLAUDE.md en cada `next dev` con su propio aviso para
  // agentes de IA; este proyecto ya tiene su CLAUDE.md con reglas propias.
  agentRules: false,
};

export default nextConfig;
