"use client";

import { Crosshair, Crop as CropIcon } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEDIA_SPECS, checkResolution, describeSpec, type Crop, type MediaKind } from "@/domain/media-specs";
import type { MediaEdit } from "../schema";
import { DEFAULT_ADJUSTMENTS } from "../schema";
import { AdjustmentsPanel, adjustmentsFilter } from "./adjustments";
import { CropStage } from "./crop-stage";
import { FocalPicker } from "./focal-picker";
import { PreviewFrames } from "./preview-frames";
import { RemoveBackgroundButton } from "./remove-background-button";
import { useCropPreview } from "./use-crop-preview";

type ImageEditorProps = {
  kind: MediaKind;
  src: string;
  /** Tamaño de la imagen como se ve (con la orientación EXIF ya aplicada). */
  natural: { w: number; h: number };
  initial?: MediaEdit;
  onSave: (edit: MediaEdit) => void;
  onCancel: () => void;
  /** Si se entrega y el tipo es `fighter_body`, aparece "Quitar fondo"; el padre sube el PNG resultante como nuevo original. */
  onBackgroundRemoved?: (cutout: Blob) => void;
};

type Mode = "crop" | "focus";
type Rotation = MediaEdit["rotation"];

export function ImageEditor({ kind, src, natural, initial, onSave, onCancel, onBackgroundRemoved }: ImageEditorProps) {
  const spec = MEDIA_SPECS[kind];
  const [mode, setMode] = useState<Mode>("crop");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<Rotation>(initial?.rotation ?? 0);
  const [aspectChoice, setAspectChoice] = useState("original");
  const [pixels, setPixels] = useState<Crop | null>(initial?.crop ?? null);
  const [focal, setFocal] = useState(initial?.focal ?? { x: 0.5, y: 0.5 });
  const [adjustments, setAdjustments] = useState(initial?.adjustments ?? DEFAULT_ADJUSTMENTS);
  const [alt, setAlt] = useState(initial?.alt ?? "");

  const filter = adjustmentsFilter(adjustments);
  const previewSrc = useCropPreview(src, pixels, rotation);
  const resolution = checkResolution(kind, natural.w, natural.h);

  const sideways = rotation === 90 || rotation === 270;
  const originalAspect = sideways ? natural.h / natural.w : natural.w / natural.h;
  const aspect = spec.aspect ?? (aspectChoice === "original" ? originalAspect : Number(aspectChoice));

  function rotate(delta: 90 | -90) {
    setRotation((current) => ((current + delta + 360) % 360) as Rotation);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{describeSpec(kind)}</p>
        {resolution.warning ? (
          <p role="status" className="border-l-4 border-primary bg-muted p-3 text-sm">
            {resolution.warning}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2" role="group" aria-label="Modo del editor">
            <Button type="button" variant={mode === "crop" ? "default" : "outline"} aria-pressed={mode === "crop"} onClick={() => setMode("crop")}>
              <CropIcon aria-hidden /> Recortar
            </Button>
            <Button type="button" variant={mode === "focus" ? "default" : "outline"} aria-pressed={mode === "focus"} onClick={() => setMode("focus")}>
              <Crosshair aria-hidden /> Punto de enfoque
            </Button>
          </div>

          {kind === "fighter_body" && onBackgroundRemoved ? (
            <RemoveBackgroundButton src={src} onDone={onBackgroundRemoved} />
          ) : null}

          {mode === "crop" ? (
            <CropStage
              src={src}
              aspect={aspect}
              crop={position}
              zoom={zoom}
              rotation={rotation}
              filter={filter}
              initialPixels={pixels}
              freeAspect={spec.aspect === null}
              aspectChoice={aspectChoice}
              onCropChange={setPosition}
              onZoomChange={setZoom}
              onRotate={rotate}
              onAspectChange={setAspectChoice}
              onCropComplete={setPixels}
            />
          ) : (
            <FocalPicker
              src={previewSrc}
              aspect={pixels ? pixels.width / pixels.height : aspect}
              focal={focal}
              filter={filter}
              onChange={setFocal}
            />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <PreviewFrames kind={kind} src={previewSrc} focal={focal} filter={filter} />
          <AdjustmentsPanel value={adjustments} onChange={setAdjustments} />
          <FormField id="media-alt" label="Texto alternativo" hint="Describe la imagen para personas con lector de pantalla y para Google.">
            <Input id="media-alt" value={alt} maxLength={300} onChange={(event) => setAlt(event.target.value)} />
          </FormField>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-border bg-background p-4 sm:static sm:mx-0 sm:border-0 sm:p-0">
        <Button type="button" className="flex-1 sm:flex-none" onClick={() => onSave({ crop: pixels, rotation, focal, adjustments, alt: alt.trim() })}>
          Guardar imagen
        </Button>
        <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
