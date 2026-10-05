import type { Metadata } from "next";
import { PageHeader, PageShell } from "@/components/site/page-shell";
import { FighterApplicationForm } from "@/features/inbox/components/fighter-application-form";

export const metadata: Metadata = {
  title: "Quiero pelear | Guerra Campal",
  description: "Postula para pelear en Guerra Campal: cuéntanos tu peso, récord y gimnasio y te escribimos.",
};

export default function QuieroPelearPage() {
  return (
    <PageShell>
      <PageHeader title="Quiero pelear" className="mb-10">
        <p className="mt-6 max-w-prose text-lg text-white/90">
          ¿Entrenas MMA y quieres subir al ring de Guerra Campal? Cuéntanos de ti. Revisamos cada postulación y te escribimos si tu perfil encaja con una próxima velada.
        </p>
      </PageHeader>
      <div className="max-w-[760px]">
        <FighterApplicationForm />
      </div>
    </PageShell>
  );
}
