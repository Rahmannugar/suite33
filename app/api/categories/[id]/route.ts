import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/config";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId;

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category || category.businessId !== businessId) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { name: name.trim().toLowerCase() },
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        role: true,
        business: { select: { id: true } },
        Staff: { select: { businessId: true } },
      },
    });

    if (profile?.role !== "ADMIN" && profile?.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const businessId = profile.business?.id || profile.Staff?.businessId;

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category || category.businessId !== businessId) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const items = await prisma.inventory.findMany({
      where: { categoryId: params.id },
      select: { id: true },
    });

    if (items.length > 0) {
      return NextResponse.json(
        { error: "Category in use by existing items" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
