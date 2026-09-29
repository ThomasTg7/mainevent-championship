import { db } from "@/db";
import { handlePurge } from "@/features/trash/purge-handler";
import { purgeExpired } from "@/features/trash/trash";

export async function GET(request: Request): Promise<Response> {
  return handlePurge(request, { db, purgeExpired });
}
