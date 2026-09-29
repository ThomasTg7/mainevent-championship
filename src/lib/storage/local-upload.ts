import type { LocalDriver } from "./local";

/** Recibe el PUT que el navegador hace a la URL firmada del driver local (desarrollo o VPS sin S3). */
export async function handleLocalUpload(request: Request, key: string, storage: LocalDriver): Promise<Response> {
  const grant = storage.verifyUpload(key, new URL(request.url).searchParams);
  if (!grant) {
    return Response.json({ error: "Enlace de subida inválido o vencido" }, { status: 403 });
  }

  if (request.headers.get("content-type") !== grant.contentType) {
    return Response.json({ error: "Formato no permitido" }, { status: 400 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > grant.maxBytes) {
    return Response.json({ error: "El archivo es demasiado grande" }, { status: 413 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > grant.maxBytes) {
    return Response.json({ error: "El archivo es demasiado grande" }, { status: 413 });
  }

  await storage.put(key, body, grant.contentType);
  return Response.json({ ok: true });
}
