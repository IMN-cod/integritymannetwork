// Quick SMTP smoke test for Google Workspace.
// Usage (PowerShell):
//   $env:SMTP_USER="you@yourdomain.com"
//   $env:SMTP_PASS="xxxx-xxxx-xxxx-xxxx"   # 16-char App Password, no spaces
//   $env:SMTP_TO="your-personal@example.com"
//   node scripts/test-smtp.mjs
//
// Optional:
//   $env:SMTP_HOST="smtp.gmail.com"
//   $env:SMTP_PORT="587"
//   $env:SMTP_FROM_NAME="The Integrity Man Network"

import nodemailer from "nodemailer";

const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SMTP_TO,
  SMTP_FROM_NAME = "The Integrity Man Network",
} = process.env;

if (!SMTP_USER || !SMTP_PASS || !SMTP_TO) {
  console.error("Missing required env vars: SMTP_USER, SMTP_PASS, SMTP_TO");
  process.exit(1);
}

const port = Number(SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s+/g, "") },
});

console.log(`→ Verifying SMTP connection to ${SMTP_HOST}:${port} as ${SMTP_USER} ...`);
try {
  await transporter.verify();
  console.log("✓ SMTP connection verified");
} catch (err) {
  console.error("✗ SMTP verify failed:", err.message);
  process.exit(1);
}

console.log(`→ Sending test email to ${SMTP_TO} ...`);
try {
  const info = await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
    to: SMTP_TO,
    subject: "SMTP test — Integrity Man Network",
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border:1px solid #eee;border-radius:12px;">
      <h2 style="color:#ea580c;margin:0 0 12px;">SMTP Test ✓</h2>
      <p style="color:#374151;font-size:14px;line-height:1.6;">If you're reading this, Google Workspace SMTP is working correctly for The Integrity Man Network.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:20px;">Sent at ${new Date().toLocaleString()}</p>
    </div>`,
  });
  console.log("✓ Sent. Message ID:", info.messageId);
  console.log("  Accepted:", info.accepted);
  console.log("  Rejected:", info.rejected);
} catch (err) {
  console.error("✗ Send failed:", err.message);
  process.exit(1);
}
