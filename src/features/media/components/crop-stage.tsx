"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Crop } from "@/domain/media-specs";
import { RangeField } from "./range-field";

const FREE_ASPECTS = [
  { value: "original", label: "Original" },
  { value: "1", label: "1:1 (cuadrada)" },
  { value: "1.5", label: "3:2" },
  { value: "1.3333333", label: "4:3" },
  { value: "1.7777778", label: "16:9" },
  { value: "0.8", label: "4:5 (vertical)" },
] as const;

type CropStageProps = {
  src: string;
  aspect: number;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  filter: string;
  initialPixels: Crop | null;
  /** Solo los tipos de proporción libre permiten elegir otra. */
  freeAspect: boolean;
  aspectChoice: string;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onRotate: (delta: 90 | -90) => void;
  onAspectChange: (value: string) => void;
  onCropComplete: (pixels: Crop) => void;
};

export function CropStage(props: CropStageProps) {
  const { freeAspect, rotation } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-[55vh] min-h-72 max-h-[32rem] overflow-hidden bg-black">
        <Cropper
          image={props.src}
          crop={props.crop}
          zoom={props.zoom}
          rotation={rotation}
          aspect={props.aspect}
          minZoom={1}
          maxZoom={3}
          initialCroppedAreaPixels={props.initialPixels ?? undefined}
          mediaProps={{ style: { filter: props.filter } }}
          onCropChange={props.onCropChange}
          onZoomChange={props.onZoomChange}
          onCropComplete={(_area, pixels) => props.onCropComplete(pixels)}
        />
      </div>

      <RangeField
        id="crop-zoom"
        label="Zoom"
        min={1}
        max={3}
        step={0.05}
        value={props.zoom}
        display={`${Math.round(props.zoom * 100)}%`}
        onChange={props.onZoomChange}
      />

      <div className="flex flex-wrap items-end gap-2">
        <Button type="button" variant="outline" onClick={() => props.onRotate(-90)}>
          <RotateCcw aria-hidden /> Girar a la izquierda
        </Button>
        <Button type="button" variant="outline" onClick={() => props.onRotate(90)}>
          <RotateCw aria-hidden /> Girar a la derecha
        </Button>
        {freeAspect ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="crop-aspect">Proporción del recorte</Label>
            <select
              id="crop-aspect"
              value={props.aspectChoice}
              onChange={(event) => props.onAspectChange(event.target.value)}
              className="h-11 border border-input bg-background px-2 text-base md:text-sm"
            >
              {FREE_ASPECTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
