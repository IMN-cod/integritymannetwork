import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "STATUS_CHANGE"
  | "ROLE_CHANGE"
  | "SETTINGS_UPDATE"
  | "BULK_ACTION";

export type AuditEntity =
  | "User"
  | "BlogPost"
  | "Event"
  | "Product"
  | "Order"
  | "Donation"
  | "ContactMessage"
  | "SiteSetting"
  | "Session"
  | "DonationCampaign";

interface LogOptions {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: Record<string, unknown>;
  adminId?: string; // override — used when session isn't available (e.g., login)
}

/**
 * Log an admin action to the audit trail.
 * Automatically captures the current admin session, IP, and user agent.
 */
export async function logAdminAction(options: LogOptions): Promise<void> {
  try {
    let adminId = options.adminId;

    if (!adminId) {
      const session = await auth();
      adminId = session?.user?.id;
    }

    if (!adminId) {
      console.warn("[AUDIT] No admin ID available, skipping audit log");
      return;
    }

    // Get request headers for IP and user agent
    let ip: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ip =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        null;
      userAgent = headersList.get("user-agent") || null;
    } catch {
      // headers() not available outside of request context
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        details: options.details
          ? (options.details as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    // Never let audit logging break the main operation
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}

/**
 * Log a login attempt (successful or failed).
 */
export async function logLoginAttempt({
  email,
  success,
  reason,
}: {
  email: string;
  success: boolean;
  reason?: string;
}): Promise<void> {
  try {
    let ip: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ip =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        null;
      userAgent = headersList.get("user-agent") || null;
    } catch {
      // headers() not available
    }

    await prisma.loginAttempt.create({
      data: {
        email,
        success,
        ip,
        userAgent,
        reason: reason || null,
      },
    });
  } catch (error) {
    console.error("[LOGIN_ATTEMPT_LOG_ERROR]", error);
  }
}
