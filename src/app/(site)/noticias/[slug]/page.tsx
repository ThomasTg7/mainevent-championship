import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { PreviewBanner } from "@/features/fighters/components/preview-banner";
import { getCachedPublicPost } from "@/features/posts/cached-queries";
import { PostArticle } from "@/features/posts/components/post-article";
import { getPublicPostBySlug } from "@/features/posts/queries";
import { verifyPreviewToken } from "@/features/publication/preview";
import { publicUrl } from "@/lib/site-urls";

/**
 * Con un token de vista previa válido para esta noticia se muestra aunque sea borrador (sin caché); en cualquier otro
 * caso, solo si es pública ahora. Se comparte entre la página y `generateMetadata`.
 */
const loadPost = cache(async (slug: string, previewToken: string | undefined) => {
  // La firma y la fecha se revisan antes de leer: un `?preview=` inventado no cuesta una consulta sin caché.
  if (previewToken && verifyPreviewToken(previewToken)) {
    const draft = await getPublicPostBySlug(db, slug, { preview: true });
    if (draft && verifyPreviewToken(previewToken, { entity: "post", id: draft.id })) {
      return { post: draft, isPreview: true };
    }
  }
  return { post: await getCachedPublicPost(slug), isPreview: false };
});

function previewParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { post, isPreview } = await loadPost(slug, previewParam(query.preview));
  if (!post) return { title: "Noticia no encontrada | Guerra Campal" };

  return {
    title: `${post.title} | Guerra Campal`,
    description: post.excerpt ?? `${post.category.name}: ${post.title}`,
    ...(isPreview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function PostPage({ params, searchParams }: PageProps<"/noticias/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { post, isPreview } = await loadPost(slug, previewParam(query.preview));
  if (!post) notFound();

  return (
    <article>
      <PostArticle post={post} shareUrl={publicUrl(`/noticias/${post.slug}`)} />
      {isPreview ? <PreviewBanner subject="esta noticia" /> : null}
    </article>
  );
}
