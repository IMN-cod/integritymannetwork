import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function getSmtpConfig() {
  const keys = ["smtpHost", "smtpPort", "smtpUser", "smtpPassword", "emailFromName", "emailFromAddress"];
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });
  const config: Record<string, string> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }
  return config;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    const config = await getSmtpConfig();

    if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
      console.warn("[EMAIL] SMTP not configured, skipping email to", to);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort || "587"),
      secure: parseInt(config.smtpPort || "587") === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `"${config.emailFromName || "The Integrity Man Network"}" <${config.emailFromAddress || config.smtpUser}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    return false;
  }
}

export function eventRegistrationEmail({
  eventTitle,
  attendeeName,
  ticketCount,
  eventDate,
  eventLocation,
  eventVenue,
}: {
  eventTitle: string;
  attendeeName: string;
  ticketCount: number;
  eventDate: string;
  eventLocation?: string | null;
  eventVenue?: string | null;
}) {
  const locationStr = [eventVenue, eventLocation].filter(Boolean).join(", ");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 24px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Registration Confirmed ✓</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">You're all set for the event!</p>
      </div>
      <div style="padding:32px 24px;">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>${attendeeName}</strong>,
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Your registration for <strong>${eventTitle}</strong> has been confirmed. We look forward to seeing you!
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Event</td>
              <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${eventTitle}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6;">Date</td>
              <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;border-top:1px solid #f3f4f6;">${eventDate}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6;">Tickets</td>
              <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;border-top:1px solid #f3f4f6;">${ticketCount}</td>
            </tr>
            ${locationStr ? `<tr>
              <td style="padding:8px 0;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6;">Location</td>
              <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;border-top:1px solid #f3f4f6;">${locationStr}</td>
            </tr>` : ""}
          </table>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0;">
          If you have any questions, reply to this email or reach out through our website.
        </p>
      </div>
      <div style="border-top:1px solid #f3f4f6;padding:20px 24px;text-align:center;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">The Integrity Man Network</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
