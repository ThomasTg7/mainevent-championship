/// <reference lib="webworker" />
import { AutoModel, AutoProcessor, RawImage, env } from "@huggingface/transformers";

// El modelo se baja del Hub de Hugging Face la primera vez y el navegador lo guarda en caché.
env.allowLocalModels = false;

const MODEL_ID = "Xenova/modnet";

type Request = { id: number; blob: Blob };

let loading: Promise<{ model: Awaited<ReturnType<typeof AutoModel.from_pretrained>>; processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> }> | null = null;

function loadModel(onProgress: (value: number) => void) {
  loading ??= (async () => {
    const options = {
      progress_callback: (event: { status: string; progress?: number }) => {
        if (event.status === "progress" && typeof event.progress === "number") onProgress(event.progress / 100);
      },
    };
    const [model, processor] = await Promise.all([
      AutoModel.from_pretrained(MODEL_ID, { dtype: "fp32", ...options }),
      AutoProcessor.from_pretrained(MODEL_ID, options),
    ]);
    return { model, processor };
  })();
  // Si la descarga falla, el próximo intento vuelve a empezar.
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

async function removeBackground(blob: Blob, onProgress: (value: number) => void): Promise<Blob> {
  const { model, processor } = await loadModel(onProgress);
  const image = await RawImage.fromBlob(blob);
  const { pixel_values } = await processor(image);
  const { output } = await model({ input: pixel_values });
  const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(image.width, image.height);

  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas no disponible");

  const bitmap = await createImageBitmap(blob);
  context.drawImage(bitmap, 0, 0, image.width, image.height);
  const pixels = context.getImageData(0, 0, image.width, image.height);
  for (let i = 0; i < mask.data.length; i++) {
    pixels.data[4 * i + 3] = mask.data[i];
  }
  context.putImageData(pixels, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

self.addEventListener("message", async (event: MessageEvent<Request>) => {
  const { id, blob } = event.data;
  try {
    const result = await removeBackground(blob, (value) => self.postMessage({ id, type: "progress", value }));
    self.postMessage({ id, type: "done", blob: result });
  } catch (error) {
    self.postMessage({ id, type: "error", message: error instanceof Error ? error.message : "Error desconocido" });
  }
});
