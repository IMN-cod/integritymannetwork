// ═══════════════════════════════════════════════════════
// PAYSTACK INTEGRATION
// ═══════════════════════════════════════════════════════

import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
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
}: {
  email: string;
  amount: number; // In Naira — will be converted to Kobo
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to Pesewas
      reference,
      callback_url: callbackUrl,
      metadata: metadata || {},
      currency: "GHS",
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Paystack initialization failed");
  }

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
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Verification failed");
  }

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
    body: JSON.stringify({
      name,
      amount: Math.round(amount * 100),
      interval,
      currency: "GHS",
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Plan creation failed");
  }

  return data.data;
}

/**
 * Validate Paystack webhook hash
 */
export function validatePaystackWebhook(
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return hash === signature;
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

  if (!data.status) {
    throw new Error(data.message || "Mobile money charge failed");
  }

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

  if (!data.status) {
    throw new Error(data.message || "Bank transfer charge failed");
  }

  return data.data as {
    reference: string;
    status: string;
    display_text: string;
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
    body: JSON.stringify({ reference, otp }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "OTP submission failed");
  }

  return data.data as {
    reference: string;
    status: string;
    display_text: string;
  };
}
