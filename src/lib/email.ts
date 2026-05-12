import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

const SETTING_KEYS = [
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpPassword",
  "emailFromName",
  "emailFromAddress",
  "adminEmail",
  "supportEmail",
  "siteName",
  "siteUrl",
  "notifyNewMembers",
  "notifyDonations",
  "notifyMessages",
  "notifyOrders",
  "notifyEvents",
  "notifyCourseEnrollments",
] as const;

export type EmailSettings = Partial<Record<(typeof SETTING_KEYS)[number], string>>;

export async function getEmailSettings(): Promise<EmailSettings> {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });
  const config: EmailSettings = {};
  for (const s of settings) {
    (config as Record<string, string>)[s.key] = s.value;
  }
  return config;
}

interface SmtpOverride {
  host: string;
  port: number;
  user: string;
  password: string;
  fromName?: string;
  fromAddress?: string;
}

export async function sendEmail(
  { to, subject, html, replyTo }: EmailOptions,
  override?: SmtpOverride
): Promise<{ ok: boolean; error?: string }> {
  try {
    let host: string;
    let port: number;
    let user: string;
    let pass: string;
    let fromName: string;
    let fromAddress: string;

    if (override) {
      host = override.host;
      port = override.port;
      user = override.user;
      pass = override.password;
      fromName = override.fromName || "The Integrity Man Network";
      fromAddress = override.fromAddress || override.user;
    } else {
      const config = await getEmailSettings();
      if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
        const msg = "SMTP not configured";
        console.warn("[EMAIL]", msg, "— skipping email to", to);
        return { ok: false, error: msg };
      }
      host = config.smtpHost;
      port = parseInt(config.smtpPort || "587");
      user = config.smtpUser;
      pass = config.smtpPassword;
      fromName = config.emailFromName || config.siteName || "The Integrity Man Network";
      fromAddress = config.emailFromAddress || config.smtpUser;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[EMAIL_SEND_ERROR]", msg);
    return { ok: false, error: msg };
  }
}

export async function verifySmtpConnection(override: SmtpOverride): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: override.host,
      port: override.port,
      secure: override.port === 465,
      auth: { user: override.user, pass: override.password },
    });
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ─── Admin notification helper ──────────────────────────────────────────────

type NotifyEvent =
  | "newMember"
  | "donation"
  | "message"
  | "order"
  | "event"
  | "courseEnrollment";

const EVENT_TOGGLE: Record<NotifyEvent, keyof EmailSettings> = {
  newMember: "notifyNewMembers",
  donation: "notifyDonations",
  message: "notifyMessages",
  order: "notifyOrders",
  event: "notifyEvents",
  courseEnrollment: "notifyCourseEnrollments",
};

export async function notifyAdmins({
  event,
  subject,
  html,
  replyTo,
}: {
  event: NotifyEvent;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const config = await getEmailSettings();
  const toggle = config[EVENT_TOGGLE[event]];
  if (toggle === "false") {
    return { ok: false, skipped: true };
  }

  const recipients = [config.adminEmail, config.supportEmail]
    .filter((e): e is string => Boolean(e && e.trim()))
    .filter((e, i, arr) => arr.indexOf(e) === i);

  if (recipients.length === 0) {
    console.warn("[EMAIL] No admin recipients configured for event:", event);
    return { ok: false, error: "No admin email configured" };
  }

  return sendEmail({ to: recipients, subject, html, replyTo });
}

// ─── Templates ──────────────────────────────────────────────────────────────

interface BrandedEmailOptions {
  preheader?: string;
  heading: string;
  intro?: string;
  rows?: Array<{ label: string; value: string }>;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  siteName?: string;
}

export function brandedEmail({
  preheader,
  heading,
  intro,
  rows,
  body,
  ctaLabel,
  ctaUrl,
  siteName = "The Integrity Man Network",
}: BrandedEmailOptions): string {
  const rowsHtml = rows
    ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${rows
            .map(
              (r, i) => `<tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;${i > 0 ? "border-top:1px solid #f3f4f6;" : ""}">${escapeHtml(r.label)}</td>
            <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;${i > 0 ? "border-top:1px solid #f3f4f6;" : ""}">${escapeHtml(r.value)}</td>
          </tr>`
            )
            .join("")}
        </table>
      </div>`
    : "";

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<div style="text-align:center;margin:24px 0 8px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">${escapeHtml(ctaLabel)}</a>
      </div>`
      : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:600;">${escapeHtml(heading)}</h1>
    </div>
    <div style="padding:28px 24px;">
      ${intro ? `<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>` : ""}
      ${rowsHtml}
      ${body ? `<div style="color:#374151;font-size:14px;line-height:1.6;">${body}</div>` : ""}
      ${ctaHtml}
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:18px 24px;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">${escapeHtml(siteName)}</p>
    </div>
  </div>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export function welcomeMemberEmail(firstName: string, siteUrl?: string): string {
  return brandedEmail({
    preheader: "Welcome to The Integrity Man Network",
    heading: "Welcome aboard ✓",
    intro: `Hi <strong>${escapeHtml(firstName)}</strong>, thanks for joining The Integrity Man Network. We're excited to have you in this community of men committed to integrity, growth, and purpose.`,
    body: `<p style="margin:0 0 12px;">Here's what you can do next:</p>
<ul style="margin:0 0 12px;padding-left:20px;color:#374151;">
  <li>Complete your profile</li>
  <li>Browse upcoming events</li>
  <li>Explore our courses and resources</li>
  <li>Join the conversation in the community</li>
</ul>`,
    ctaLabel: "Visit your dashboard",
    ctaUrl: siteUrl ? `${siteUrl.replace(/\/$/, "")}/dashboard` : undefined,
  });
}

export function passwordResetEmail(resetUrl: string): string {
  return brandedEmail({
    preheader: "Reset your password",
    heading: "Reset your password",
    intro: "We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.",
    ctaLabel: "Reset password",
    ctaUrl: resetUrl,
    body: `<p style="color:#6b7280;font-size:12px;margin:16px 0 0;">If you didn't request this, you can safely ignore this email.</p>`,
  });
}

// ─── Payment lifecycle notifications ────────────────────────────────────────

function formatMoney(amount: number, currency = "GHS"): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendOrderPaidNotifications(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { email: true, firstName: true } },
      },
    });
    if (!order) return;

    const settings = await getEmailSettings();
    const siteUrl = settings.siteUrl?.replace(/\/$/, "") || process.env.NEXT_PUBLIC_APP_URL || "";
    const shipping = (order.shippingAddress as Record<string, string>) || {};
    const customerEmail = shipping.email || order.user?.email;
    const customerName = shipping.firstName
      ? `${shipping.firstName} ${shipping.lastName || ""}`.trim()
      : order.user?.firstName || "there";

    const itemsHtml = order.items
      .map(
        (it) =>
          `<tr><td style="padding:6px 0;color:#374151;font-size:13px;">${escapeHtml(it.productName)} × ${it.quantity}</td><td style="padding:6px 0;color:#111827;font-size:13px;text-align:right;font-weight:600;">${formatMoney(Number(it.price) * it.quantity)}</td></tr>`
      )
      .join("");

    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: brandedEmail({
          preheader: `Your order ${order.orderNumber} is confirmed`,
          heading: "Order Confirmed ✓",
          intro: `Hi <strong>${escapeHtml(customerName)}</strong>, thanks for your order! We've received your payment and are preparing your items.`,
          rows: [
            { label: "Order #", value: order.orderNumber },
            { label: "Subtotal", value: formatMoney(Number(order.subtotal)) },
            { label: "Shipping", value: formatMoney(Number(order.shippingCost)) },
            { label: "Total", value: formatMoney(Number(order.total)) },
          ],
          body: `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Items:</p>
<table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>`,
          ctaLabel: "View order",
          ctaUrl: siteUrl ? `${siteUrl}/dashboard` : undefined,
        }),
      });
    }

    await notifyAdmins({
      event: "order",
      subject: `New paid order: ${order.orderNumber} (${formatMoney(Number(order.total))})`,
      html: brandedEmail({
        preheader: `Order ${order.orderNumber} paid`,
        heading: "New Paid Order",
        intro: `<strong>${escapeHtml(customerName)}</strong> just placed an order.`,
        rows: [
          { label: "Order #", value: order.orderNumber },
          { label: "Customer", value: customerName },
          { label: "Email", value: customerEmail || "—" },
          { label: "Total", value: formatMoney(Number(order.total)) },
          { label: "Payment", value: order.paymentMethod },
        ],
        ctaLabel: "View in admin",
        ctaUrl: siteUrl ? `${siteUrl}/admin/orders` : undefined,
      }),
    });
  } catch (error) {
    console.error("[ORDER_PAID_NOTIFY]", error);
  }
}

export async function sendDonationPaidNotifications(donationId: string): Promise<void> {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        user: { select: { email: true, firstName: true } },
        campaign: { select: { title: true } },
      },
    });
    if (!donation) return;

    const settings = await getEmailSettings();
    const siteUrl = settings.siteUrl?.replace(/\/$/, "") || process.env.NEXT_PUBLIC_APP_URL || "";
    const donorEmail = donation.donorEmail || donation.user?.email;
    const donorName = donation.donorName || donation.user?.firstName || "Friend";
    const amount = formatMoney(Number(donation.amount), donation.currency || "GHS");

    if (donorEmail) {
      await sendEmail({
        to: donorEmail,
        subject: `Thank you for your donation — ${amount}`,
        html: brandedEmail({
          preheader: `Your donation of ${amount} was received`,
          heading: "Thank You",
          intro: `Hi <strong>${escapeHtml(donorName)}</strong>, thank you for your generous donation. Your support helps us continue building a community of men of integrity and purpose.`,
          rows: [
            { label: "Amount", value: amount },
            { label: "Recurring", value: donation.isRecurring ? "Yes" : "No" },
            ...(donation.campaign?.title ? [{ label: "Campaign", value: donation.campaign.title }] : []),
            { label: "Reference", value: donation.id.slice(-8).toUpperCase() },
          ],
          body: donation.message
            ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Your message:</p><div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;color:#111827;font-size:13px;font-style:italic;">${escapeHtml(donation.message)}</div>`
            : undefined,
        }),
      });
    }

    await notifyAdmins({
      event: "donation",
      subject: `New donation received: ${amount}`,
      html: brandedEmail({
        preheader: "A new donation was received",
        heading: "New Donation",
        intro: `<strong>${escapeHtml(donorName)}</strong> just donated ${amount}.`,
        rows: [
          { label: "Amount", value: amount },
          { label: "Donor", value: donorName },
          { label: "Email", value: donorEmail || "—" },
          { label: "Recurring", value: donation.isRecurring ? "Yes" : "No" },
          { label: "Payment", value: donation.paymentMethod },
          ...(donation.campaign?.title ? [{ label: "Campaign", value: donation.campaign.title }] : []),
        ],
        ctaLabel: "View in admin",
        ctaUrl: siteUrl ? `${siteUrl}/admin/donations` : undefined,
      }),
    });
  } catch (error) {
    console.error("[DONATION_PAID_NOTIFY]", error);
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
