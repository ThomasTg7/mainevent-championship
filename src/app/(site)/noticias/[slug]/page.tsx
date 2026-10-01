import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PhotoGallery } from "@/components/media/photo-gallery";
import { db } from "@/db";
import { PreviewBanner } from "@/features/fighters/components/preview-banner";
import { getCachedPublicPost } from "@/features/posts/cached-queries";
import { PostHeader } from "@/features/posts/components/post-header";
import { PostRelated } from "@/features/posts/components/post-related";
import { ShareButtons } from "@/features/posts/components/share-buttons";
import { getPublicPostBySlug } from "@/features/posts/queries";
import { PostBody } from "@/features/posts/render/post-body";
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
      <PostHeader post={post} />
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-14 px-[clamp(16px,4vw,64px)] pb-24 pt-10">
        <div className="mx-auto w-full max-w-[720px]">
          <PostBody doc={post.body} media={post.bodyMedia} />
        </div>
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-14">
          {post.gallery.length > 0 ? (
            <section aria-labelledby="post-gallery-title" data-slot="post-gallery" className="flex flex-col gap-6">
              <h2 id="post-gallery-title" className="font-display text-[clamp(26px,4vw,38px)] uppercase leading-none text-white">
                Galería
              </h2>
              <PhotoGallery media={post.gallery} title={`Galería de ${post.title}`} />
            </section>
          ) : null}
          <PostRelated fighters={post.fighters} events={post.events} />
          <ShareButtons url={publicUrl(`/noticias/${post.slug}`)} title={post.title} />
        </div>
      </div>
      {isPreview ? <PreviewBanner subject="esta noticia" /> : null}
    </article>
  );
}
