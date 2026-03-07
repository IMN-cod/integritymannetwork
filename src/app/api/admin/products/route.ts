import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/products — List all products
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          sku: true,
          stock: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          category: {
            select: { name: true },
          },
          _count: {
            select: { orderItems: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products — Create a new product
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
    const {
      name,
      description,
      price,
      comparePrice,
      images,
      categoryId,
      sku,
      stock,
      isActive,
      isFeatured,
      weight,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const slug = slugify(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        price,
        comparePrice: comparePrice || null,
        images: images || [],
        categoryId: categoryId || null,
        sku: sku || null,
        stock: stock ?? 0,
        isActive: isActive ?? true,
        isFeatured: isFeatured || false,
        weight: weight || null,
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      details: { name, slug: finalSlug, price, sku },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products — Update a product
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) {
      data.name = updates.name;
      data.slug = slugify(updates.name);
    }
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.price !== undefined) data.price = updates.price;
    if (updates.comparePrice !== undefined) data.comparePrice = updates.comparePrice;
    if (updates.images !== undefined) data.images = updates.images;
    if (updates.categoryId !== undefined) data.categoryId = updates.categoryId;
    if (updates.sku !== undefined) data.sku = updates.sku;
    if (updates.stock !== undefined) data.stock = parseInt(updates.stock);
    if (updates.isActive !== undefined) data.isActive = updates.isActive;
    if (updates.isFeatured !== undefined) data.isFeatured = updates.isFeatured;
    if (updates.weight !== undefined) data.weight = updates.weight;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      details: data,
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products — Delete a product
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await prisma.product.delete({ where: { id } });

    await logAdminAction({
      action: "DELETE",
      entity: "Product",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
