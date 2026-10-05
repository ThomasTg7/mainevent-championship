import type { Metadata } from "next";
import { PageEmpty, PageHeader, PageShell } from "@/components/site/page-shell";
import { hasPostBodyContent } from "@/domain/post-body";
import { PostBody } from "@/features/posts/render/post-body";
import { getCachedSetting } from "@/features/settings/cached-queries";
import { formatDate } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Política de privacidad | Guerra Campal",
  description: "Cómo Guerra Campal cuida y usa los datos personales de quienes la contactan.",
};

export default async function PrivacidadPage() {
  const { body, updatedAt } = await getCachedSetting("privacy");

  return (
    <PageShell>
      <PageHeader title="Política de privacidad" className="mb-10">
        {updatedAt ? <p className="mt-5 font-cond text-sm font-bold uppercase tracking-[.1em] text-muted-foreground">Actualizado el {formatDate(new Date(updatedAt))}</p> : null}
      </PageHeader>
      {hasPostBodyContent(body) ? (
        <div className="max-w-[720px]">
          <PostBody doc={body} media={{}} />
        </div>
      ) : (
        <PageEmpty title="Pronto publicaremos nuestra política" text="Estamos preparando este documento." />
      )}
    </PageShell>
  );
}
