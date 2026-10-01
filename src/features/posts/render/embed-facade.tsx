"use client";

import { ExternalLink, Play } from "lucide-react";
import { useState } from "react";
import { embedCanonicalUrl, embedSrc, type Embed, type EmbedProvider } from "@/domain/embed";

const PROVIDER_NAME: Record<EmbedProvider, string> = { instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok" };

/** Alto y ancho del reproductor de cada red: el video de YouTube es horizontal; Instagram y TikTok, una columna vertical. */
const FRAME_CLASS: Record<EmbedProvider, string> = {
  youtube: "aspect-video w-full",
  instagram: "mx-auto h-[640px] w-full max-w-[540px]",
  tiktok: "mx-auto h-[740px] w-full max-w-[340px]",
};

const FACADE_CLASS: Record<EmbedProvider, string> = {
  youtube: "aspect-video w-full",
  instagram: "mx-auto min-h-64 w-full max-w-[540px]",
  tiktok: "mx-auto min-h-64 w-full max-w-[340px]",
};

/**
 * Publicación de Instagram, YouTube o TikTok. Hasta que la persona lo pide, no se pide nada a la red (ni cookies ni
 * seguimiento): se muestra una «fachada» con un botón y el enlace a la publicación; al hacer clic se carga el reproductor.
 */
export function EmbedFacade({ embed }: { embed: Embed }) {
  const [loaded, setLoaded] = useState(false);
  const name = PROVIDER_NAME[embed.provider];

  return (
    <div className="my-8 flex flex-col gap-2">
      {loaded ? (
        <iframe
          src={embedSrc(embed)}
          title={`Publicación de ${name}`}
          className={`${FRAME_CLASS[embed.provider]} border-0 bg-surface`}
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
        />
      ) : (
        <div className={`${FACADE_CLASS[embed.provider]} flex flex-col items-center justify-center gap-4 border border-border bg-surface px-4 py-8 text-center`}>
          <span className="font-cond text-sm font-extrabold tracking-[0.14em] text-yellow uppercase">{name}</span>
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="inline-flex min-h-12 items-center gap-2 bg-yellow px-6 font-cond text-base font-extrabold tracking-[0.08em] text-black uppercase transition-colors hover:bg-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Play aria-hidden className="size-4 fill-current" /> Ver en {name}
          </button>
          <p className="max-w-xs text-sm text-white/60">Al verlo se cargará contenido de {name}, que puede usar cookies.</p>
        </div>
      )}
      <a
        href={embedCanonicalUrl(embed)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-center px-2 text-sm text-white/70 underline underline-offset-4 hover:text-yellow"
      >
        Abrir en {name} <ExternalLink aria-hidden className="size-3.5" />
      </a>
    </div>
  );
}
