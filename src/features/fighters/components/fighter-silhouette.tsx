/** Silueta de la marca para peleadores sin foto (listado y ficha): nunca un `<img>` roto ni un hueco vacío. */
export function FighterSilhouette({ className }: { className?: string }) {
  return (
    <svg data-slot="fighter-silhouette" viewBox="0 0 400 600" aria-hidden="true" focusable="false" className={className}>
      {/* La opacidad va en el grupo: las piezas se solapan y así se ve una sola silueta pareja. */}
      <g fill="currentColor" opacity=".32">
        <path d="M50 600 L62 320 Q70 238 140 222 L178 208 L178 168 L222 168 L222 208 L260 222 Q330 238 338 320 L350 600 Z" />
        <ellipse cx="200" cy="118" rx="44" ry="54" />
        <path fill="none" stroke="currentColor" strokeWidth="54" strokeLinecap="round" strokeLinejoin="round" d="M112 262 L98 372 L158 282" />
        <path fill="none" stroke="currentColor" strokeWidth="54" strokeLinecap="round" strokeLinejoin="round" d="M288 262 L302 372 L244 276" />
        <ellipse cx="158" cy="248" rx="37" ry="43" />
        <ellipse cx="244" cy="242" rx="37" ry="43" />
      </g>
    </svg>
  );
}
