# Quitar fondo en el navegador

- **Modelo:** [`Xenova/modnet`](https://huggingface.co/Xenova/modnet) (MODNet exportado a ONNX). Licencia **Apache-2.0** (verificada en la ficha del modelo el 2026-09-28).
- **Librería:** [`@huggingface/transformers`](https://github.com/huggingface/transformers.js), licencia **Apache-2.0**.
- Ambas son permisivas y permiten uso comercial. **No usar** `briaai/RMBG-*` (licencia no comercial).
- El modelo (~25 MB) se descarga desde el Hub de Hugging Face la primera vez que alguien usa "Quitar fondo" y el navegador lo guarda en caché. La foto **nunca sale del navegador**.
- Corre en un Web Worker (`worker.ts`) para no congelar la pantalla; `remove-background.ts` es la API que usa el editor.
- Para no depender del Hub en producción, se puede alojar el modelo en el propio bucket y apuntar `env.remoteHost`/`env.remotePathTemplate` en `worker.ts`.
