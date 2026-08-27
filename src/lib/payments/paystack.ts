// ═══════════════════════════════════════════════════════
// PAYSTACK INTEGRATION
// ═══════════════════════════════════════════════════════

import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_TIMEOUT_MS = 15_000;

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("Paystack is not configured");
  return key;
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
  };
}

function requestSignal() {
  return AbortSignal.timeout(PAYSTACK_TIMEOUT_MS);
}

function assertPaystackResponse(
  response: Response,
  data: { status?: boolean; message?: string },
  fallbackMessage: string
) {
  if (!response.ok || data.status !== true) {
    throw new Error(data.message || fallbackMessage);
  }
}

/**
 * Initialize a Paystack transaction
 */
export async function initializePaystackTransaction({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
  channels,
}: {
  email: string;
  amount: number; // In GHS — will be converted to Pesewas
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: Array<
    | "card"
    | "bank"
    | "ussd"
    | "qr"
    | "eft"
    | "mobile_money"
    | "bank_transfer"
    | "apple_pay"
  >;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    signal: requestSignal(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to Pesewas
      reference,
      callback_url: callbackUrl,
      metadata: metadata || {},
      currency: "GHS",
      ...(channels?.length ? { channels } : {}),
    }),
  });

  const data = await response.json();

  assertPaystackResponse(response, data, "Paystack initialization failed");

  return data.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Verify a Paystack transaction
 */
export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: getHeaders(),
      signal: requestSignal(),
    }
  );

  const data = await response.json();

  assertPaystackResponse(response, data, "Verification failed");

  return data.data as {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
    };
    metadata: Record<string, unknown>;
  };
}

/**
 * Create a Paystack subscription plan (for recurring donations)
 */
export async function createPaystackPlan({
  name,
  amount,
  interval = "monthly",
}: {
  name: string;
  amount: number;
  interval?: "daily" | "weekly" | "monthly" | "annually";
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/plan`, {
    method: "POST",
    headers: getHeaders(),
    signal: requestSignal(),
    body: JSON.stringify({
      name,
      amount: Math.round(amount * 100),
      interval,
      currency: "GHS",
    }),
  });

  const data = await response.json();

  assertPaystackResponse(response, data, "Plan creation failed");

  return data.data;
}

/**
 * Validate Paystack webhook hash
 */
export function validatePaystackWebhook(
  body: string,
  signature: string
): boolean {
  if (!signature) return false;
  let secretKey: string;
  try {
    secretKey = getSecretKey();
  } catch {
    return false;
  }
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(body)
    .digest("hex");
  const hashBuffer = Buffer.from(hash, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return (
    hashBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, signatureBuffer)
  );
}

// ═══════════════════════════════════════════════════════
// CHARGE API — Custom payment flow (no popup)
// ═══════════════════════════════════════════════════════

/**
 * Charge via Mobile Money (MTN, Vodafone, AirtelTigo)
 */
export async function chargeMobileMoney({
  email,
  amount,
  reference,
  phone,
  provider,
  metadata,
}: {
  email: string;
  amount: number;
  reference: string;
  phone: string;
  provider: "mtn" | "vod" | "tgo";
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/charge`, {
    method: "POST",
    headers: getHeaders(),
    signal: requestSignal(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      currency: "GHS",
      mobile_money: { phone, provider },
      metadata: metadata || {},
    }),
  });

  const data = await response.json();

  assertPaystackResponse(response, data, "Mobile money charge failed");

  return data.data as {
    reference: string;
    status: string;
    display_text: string;
  };
}

/**
 * Charge via Bank Transfer — generates a virtual account
 */
export async function chargeBankTransfer({
  email,
  amount,
  reference,
  metadata,
}: {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/charge`, {
    method: "POST",
    headers: getHeaders(),
    signal: requestSignal(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      currency: "GHS",
      bank_transfer: { account_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
      metadata: metadata || {},
    }),
  });

  const data = await response.json();

  assertPaystackResponse(response, data, "Bank transfer charge failed");

  return data.data as {
    reference: string;
    status: string;
    display_text: string;
  };
}

/**
 * Check the status of a charge (mobile money / bank transfer / USSD)
 * Uses GET /charge/{reference} — NOT /transaction/verify which is for standard transactions only
 */
export async function checkChargeStatus(reference: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/charge/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: getHeaders(),
      signal: requestSignal(),
    }
  );

  const data = await response.json();

  assertPaystackResponse(response, data, "Could not check charge status");

  return data.data as {
    reference: string;
    status: string; // "success" | "failed" | "pending" | "pay_offline" | "send_otp" | "timeout"
    display_text: string;
    amount: number;
    currency: string;
    channel: string;
    metadata: Record<string, unknown>;
  };
}

/**
 * Submit OTP for a pending charge
 */
export async function submitChargeOTP({
  reference,
  otp,
}: {
  reference: string;
  otp: string;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/charge/submit_otp`, {
    method: "POST",
    headers: getHeaders(),
    signal: requestSignal(),
    body: JSON.stringify({ reference, otp }),
  });

  const data = await response.json();

  assertPaystackResponse(response, data, "OTP submission failed");

  return data.data as {
    reference: string;
    status: string;
    display_text: string;
  };
}
