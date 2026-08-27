import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  PaymentValidationError,
  validatePaystackPayment,
} from "../../src/lib/payments/finalize";
import { validatePaystackWebhook } from "../../src/lib/payments/paystack";

const payment = {
  status: "success",
  reference: "DON-test-reference",
  amount: 12_500,
  currency: "GHS",
  channel: "card",
  metadata: { donationId: "donation-id" },
};

const expected = {
  expectedReference: payment.reference,
  expectedAmount: 125,
  expectedCurrency: "GHS",
};

test("accepts an exact successful Paystack payment", () => {
  assert.doesNotThrow(() => validatePaystackPayment({ payment, ...expected }));
});

test("rejects a non-successful transaction", () => {
  assert.throws(
    () => validatePaystackPayment({ payment: { ...payment, status: "pending" }, ...expected }),
    PaymentValidationError
  );
});

test("rejects a mismatched reference", () => {
  assert.throws(
    () => validatePaystackPayment({ payment: { ...payment, reference: "other" }, ...expected }),
    /reference does not match/
  );
});

test("rejects even a one-pesewa amount mismatch", () => {
  assert.throws(
    () => validatePaystackPayment({ payment: { ...payment, amount: payment.amount - 1 }, ...expected }),
    /amount does not match/
  );
});

test("rejects a mismatched currency", () => {
  assert.throws(
    () => validatePaystackPayment({ payment: { ...payment, currency: "NGN" }, ...expected }),
    /currency does not match/
  );
});

test("validates Paystack webhook HMAC signatures", () => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_unit_test_secret";
  const body = JSON.stringify({ event: "charge.success", data: payment });
  const signature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  assert.equal(validatePaystackWebhook(body, signature), true);
  assert.equal(validatePaystackWebhook(`${body} `, signature), false);
});
