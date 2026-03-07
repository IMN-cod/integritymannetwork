import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const syncSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().nullable().optional(),
      quantity: z.number().int().min(1),
    })
  ),
});

// ═══════════════════════════════════════════════════════
// POST /api/cart/sync — Merge client cart with server cart
// Called when user logs in with items already in local storage
// ═══════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = syncSchema.parse(body);

    if (!items.length) {
      // Nothing to sync — just return existing server cart
      const existing = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              stock: true,
              isActive: true,
            },
          },
        },
      });

      return NextResponse.json({ items: existing, merged: false });
    }

    // Get existing server cart items
    const serverItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
    });
    const serverMap = new Map(
      serverItems.map((item) => [`${item.productId}:${item.variantId || ""}`, item])
    );

    // Merge: client items take priority for quantity, server items preserved if not in client
    const upsertOps = items.map((clientItem) => {
      const key = `${clientItem.productId}:${clientItem.variantId || ""}`;
      const existing = serverMap.get(key);

      if (existing) {
        // Update quantity to the higher of client vs server
        const mergedQty = Math.max(clientItem.quantity, existing.quantity);
        return prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: mergedQty },
        });
      } else {
        // Add new item from client
        return prisma.cartItem.create({
          data: {
            userId: session.user.id!,
            productId: clientItem.productId,
            variantId: clientItem.variantId || null,
            quantity: clientItem.quantity,
          },
        });
      }
    });

    await Promise.all(upsertOps);

    // Return the full merged cart
    const mergedCart = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ items: mergedCart, merged: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[CART_SYNC]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
