/**
 * Cinta amarilla inclinada bajo la portada (maqueta): textos del evento que se desplazan sin parar. Decorativa: todo lo que
 * dice ya está en la portada, así que los lectores de pantalla la ignoran. Con «reducir movimiento» queda quieta (una sola
 * copia, en una fila que se envuelve).
 */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  // Cada mitad trae al menos 5 textos: con pocos se repiten, para que la cinta nunca quede corta.
  const half = Array.from({ length: Math.max(1, Math.ceil(5 / items.length)) }, () => items).flat();

  return (
    // El contenedor recorta lo que se sale por la inclinación y por el 2 % de ancho de más, sin crear scroll horizontal.
    <div className="relative z-[5] -mt-[18px] overflow-x-clip">
      <div aria-hidden="true" data-slot="marquee" className="-rotate-[1.2deg] scale-x-[1.02] overflow-hidden bg-yellow py-3.5 text-black">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
          {[0, 1].map((copy) => (
            <div key={copy} className={`flex shrink-0 ${copy === 1 ? "motion-reduce:hidden" : ""}`}>
              {half.map((text, index) => (
                <span key={`${index}-${text}`} className="flex items-center gap-11 whitespace-nowrap px-[22px] font-display text-[28px] uppercase after:text-lg after:content-['✦']">
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
