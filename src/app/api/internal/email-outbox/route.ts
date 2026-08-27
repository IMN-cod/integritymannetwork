import { NextRequest, NextResponse } from "next/server";
import { processEmailOutbox } from "@/lib/email";

export const dynamic = "force-dynamic";

function isLocalRequest(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  const isLoopbackHost =
    host === "127.0.0.1:3000" || host === "localhost:3000";
  const isLoopbackPeer =
    !forwardedFor ||
    forwardedFor === "127.0.0.1" ||
    forwardedFor === "::1" ||
    forwardedFor === "::ffff:127.0.0.1";

  // Next.js standalone synthesizes x-forwarded-for from the direct socket
  // address even when nginx was bypassed. Accept only an exact loopback host
  // and peer; public nginx requests always carry the real client address.
  return isLoopbackHost && isLoopbackPeer;
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await processEmailOutbox();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[EMAIL_OUTBOX_PROCESS]", error);
    return NextResponse.json(
      { ok: false, error: "Email queue processing failed" },
      { status: 500 }
    );
  }
}
