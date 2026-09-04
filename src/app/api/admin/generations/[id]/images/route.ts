import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { getArvanSignedReadUrl } from "@/lib/storage/arvan-upload";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await params;

    const generation = await prisma.generation.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        originalPhotoUrl: true,
        resultPhotoUrl: true,
      },
    });

    if (!generation) {
      return NextResponse.json(
        {
          success: false,
          message: "Generation not found.",
        },
        { status: 404 },
      );
    }

    const [originalUrl, resultUrl] = await Promise.all([
      getArvanSignedReadUrl(generation.originalPhotoUrl),
      getArvanSignedReadUrl(generation.resultPhotoUrl),
    ]);

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      originalUrl,
      resultUrl,
    });
  } catch (error) {
    console.error("GET /api/admin/generations/[id]/images error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load generation images.",
      },
      { status: 500 },
    );
  }
}
