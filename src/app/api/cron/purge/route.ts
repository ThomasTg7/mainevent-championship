import { NextResponse } from "next/server";
import { db } from "@/db";
import type { Db } from "@/db";
import { purgeExpired } from "@/features/trash/trash";

export async function handlePurge(request: Request, database: Db): Promise<Response> {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  const authorization = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authorization !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const purged = await purgeExpired(database, new Date());

  return NextResponse.json({ purged });
}

export async function GET(request: Request): Promise<Response> {
  return handlePurge(request, db);
}
