"use client";

import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AI_PROMPT } from "../../ai-prompt";

const STEPS = [
  "Si la noticia lleva fotos, súbelas en «Con IA». Quedan numeradas: FOTO 1, FOTO 2…",
  "Copia el prompt de abajo y pégalo en ChatGPT, Claude o Gemini. Al final escribe los datos de la noticia y qué muestra cada foto.",
  "Copia la respuesta completa de la IA, pégala en «Respuesta de la IA» y toca «Cargar en la noticia».",
  "Revisa el texto en el editor y en la vista previa. ¿Quieres cambiar algo? Pídeselo a la IA («hazla más corta», «agrega la cita de Soto») y vuelve a pegar su respuesta.",
  "Si corregiste algo a mano, toca «Copiar noticia para la IA» y pégasela junto con tu pedido: así la IA parte de tu versión.",
  "Cuando esté lista, guarda o publica como siempre.",
];

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(AI_PROMPT);
    toast.success("Prompt copiado. Pégalo en la IA y agrega los datos al final.");
  } catch {
    toast.error("No se pudo copiar. Selecciona el texto del prompt y cópialo a mano.");
  }
}

/** «¿Cómo lo hago con IA?»: los pasos y el prompt para copiar. */
export function AiHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Sparkles aria-hidden /> ¿Cómo lo hago con IA?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escribir la noticia con IA</DialogTitle>
          <DialogDescription>La IA redacta y tú revisas. Nada se publica hasta que guardes.</DialogDescription>
        </DialogHeader>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Prompt para la IA</h3>
            <Button type="button" onClick={copyPrompt}>
              <Copy aria-hidden /> Copiar prompt
            </Button>
          </div>
          <pre data-slot="ai-prompt" tabIndex={0} className="max-h-72 overflow-y-auto whitespace-pre-wrap border border-border bg-background p-3 text-xs leading-relaxed">
            {AI_PROMPT}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
