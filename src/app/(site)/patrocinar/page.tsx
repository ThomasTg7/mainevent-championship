import type { Metadata } from "next";
import { PageHeader, PageShell } from "@/components/site/page-shell";
import { SponsorshipForm } from "@/features/inbox/components/sponsorship-form";

export const metadata: Metadata = {
  title: "Patrocinar | Guerra Campal",
  description: "Haz que tu marca sea parte de Guerra Campal: escríbenos y conversemos cómo patrocinar un evento.",
};

export default function PatrocinarPage() {
  return (
    <PageShell>
      <PageHeader title="Patrocinar" className="mb-10">
        <p className="mt-6 max-w-prose text-lg text-white/90">
          Llega a la comunidad del MMA en Chile con tu marca en nuestros eventos, en la web y en nuestras redes. Cuéntanos qué tienes en mente y conversemos.
        </p>
      </PageHeader>
      <div className="max-w-[760px]">
        <SponsorshipForm />
      </div>
    </PageShell>
  );
}
