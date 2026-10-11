/** Preserve published legacy links, including nested fight pages. */
export function oflPublicPath(pathname: string): string {
  return pathname.replace(/^(\/(?:eventos|noticias)\/)([^/]+)/, (_, prefix: string, slug: string) => prefix + slug.replace(/guerra-campal/g, "ofl"));
}
