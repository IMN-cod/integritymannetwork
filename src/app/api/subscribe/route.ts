import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendEmail, notifyAdmins, brandedEmail, getEmailSettings } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "subscribe", limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalised)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : undefined;

    await prisma.newsletterSubscriber.upsert({
      where: { email: normalised },
      update: { isActive: true, name: cleanName || undefined },
      create: { email: normalised, name: cleanName || undefined, isActive: true },
    });

    // Fire-and-forget emails — do not block the response or fail the request.
    void (async () => {
      try {
        const config = await getEmailSettings();
        const siteName = config.siteName || "The Integrity Man Network";
        const siteUrl = config.siteUrl || "https://www.integritymannetwork.com";
        const firstName = cleanName?.split(/\s+/)[0] || "Friend";

        await sendEmail({
          to: normalised,
          subject: `Welcome to the ${siteName} mailing list`,
          html: brandedEmail({
            preheader: "You're subscribed to updates from The Integrity Man Network.",
            heading: `Welcome, ${firstName}!`,
            intro:
              "Thank you for subscribing. You'll now receive updates on events, resources, and the movement of men walking in integrity.",
            body: "We're glad to have you with us. Watch your inbox for upcoming gatherings, teachings, and stories from the network.",
            ctaLabel: "Visit the website",
            ctaUrl: siteUrl,
            siteName,
          }),
        });

        await notifyAdmins({
          event: "newMember",
          subject: `New newsletter subscriber: ${normalised}`,
          html: brandedEmail({
            preheader: "A new subscriber joined the mailing list.",
            heading: "New newsletter subscriber",
            rows: [
              { label: "Email", value: normalised },
              { label: "Name", value: cleanName || "—" },
              { label: "Source", value: "Website subscribe form" },
            ],
            siteName,
          }),
        });
      } catch (err) {
        console.error("[SUBSCRIBE] email send failed:", err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
