import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail, brandedEmail, getEmailSettings, verifySmtpConnection } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  to: z.string().email("Valid recipient email required"),
  // Optional override — if provided, uses these credentials instead of stored settings
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  emailFromName: z.string().optional(),
  emailFromAddress: z.string().optional(),
});

const MASKED_SECRET = "••••••••";

// POST /api/admin/settings/test-email — Send a test email
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { to, smtpHost, smtpPort, smtpUser, emailFromName, emailFromAddress } = parsed.data;
    let { smtpPassword } = parsed.data;
    if (smtpPassword === MASKED_SECRET) {
      smtpPassword = (await getEmailSettings()).smtpPassword;
    }

    // If override credentials supplied, validate all required fields
    const useOverride = Boolean(smtpHost || smtpUser || smtpPassword);
    if (useOverride && (!smtpHost || !smtpUser || !smtpPassword)) {
      return NextResponse.json(
        { error: "Provide host, username, and password together" },
        { status: 400 }
      );
    }

    const override = useOverride
      ? {
          host: smtpHost!,
          port: smtpPort || 587,
          user: smtpUser!,
          password: smtpPassword!,
          fromName: emailFromName,
          fromAddress: emailFromAddress,
        }
      : undefined;

    // First verify the connection if using override
    if (override) {
      const verify = await verifySmtpConnection(override);
      if (!verify.ok) {
        return NextResponse.json(
          { error: `SMTP connection failed: ${verify.error}` },
          { status: 400 }
        );
      }
    }

    const html = brandedEmail({
      preheader: "SMTP test email",
      heading: "SMTP Test ✓",
      intro: "If you're reading this, your email configuration is working correctly.",
      rows: [
        { label: "Sent at", value: new Date().toLocaleString() },
        { label: "Sent by", value: session.user.email || "admin" },
        { label: "Mode", value: useOverride ? "Provided credentials" : "Saved settings" },
      ],
      body: `<p>You can now send transactional emails from The Integrity Man Network admin portal — order confirmations, donation receipts, password resets, and admin alerts.</p>`,
    });

    const result = await sendEmail(
      { to, subject: "Test email from Integrity Man Network admin", html },
      override
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to send test email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error("[TEST_EMAIL]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
