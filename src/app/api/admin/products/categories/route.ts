import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// GET /api/admin/products/categories — List all categories
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.productCategory.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/admin/products/categories — Create a category
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, image } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);
    const existing = await prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const maxOrder = await prisma.productCategory.aggregate({ _max: { sortOrder: true } });

    const category = await prisma.productCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_POST]", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// DELETE /api/admin/products/categories — Delete a category
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    // Unlink products from this category
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.productCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
