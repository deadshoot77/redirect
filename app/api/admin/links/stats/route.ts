import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getLinksRedirectSummariesBatch } from "@/lib/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return unauthorized();
  }

  const rawIds = request.nextUrl.searchParams.get("ids") ?? "";
  const timeZone = request.nextUrl.searchParams.get("tz") ?? undefined;
  const ids = rawIds
    .split(",")
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)
    .slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ stats: {}, statsFallback: false });
  }

  const startedAt = Date.now();

  try {
    const result = await getLinksRedirectSummariesBatch(ids, timeZone);
    console.info("admin links stats route resolved", {
      idsCount: ids.length,
      timeZone: timeZone ?? "default",
      durationMs: Date.now() - startedAt,
      fallbackUsed: result.fallback
    });
    return NextResponse.json({ stats: result.stats, statsFallback: result.fallback });
  } catch (error) {
    console.error("admin links stats route failed", {
      idsCount: ids.length,
      timeZone: timeZone ?? "default",
      durationMs: Date.now() - startedAt,
      fallbackUsed: true,
      error: error instanceof Error ? error.message : error
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch link stats" },
      { status: 500 }
    );
  }
}
