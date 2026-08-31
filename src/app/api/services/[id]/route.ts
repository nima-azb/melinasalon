import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Service ID is required.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : undefined;

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : body.description === null
          ? null
          : undefined;

    const duration =
      body.duration !== undefined ? Number(body.duration) : undefined;

    const price =
      body.price !== undefined && body.price !== null
        ? Number(body.price)
        : body.price === null
          ? null
          : undefined;

    const isActive =
      body.isActive !== undefined ? body.isActive === true : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Service name cannot be empty.",
        },
        { status: 400 },
      );
    }

    if (
      duration !== undefined &&
      (!Number.isInteger(duration) || duration <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Duration must be a positive integer.",
        },
        { status: 400 },
      );
    }

    if (
      price !== undefined &&
      price !== null &&
      (!Number.isInteger(price) || price < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Price must be a non-negative integer.",
        },
        { status: 400 },
      );
    }

    const existingService = await prisma.service.findUnique({
      where: {
        id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found.",
        },
        { status: 404 },
      );
    }

    const service = await prisma.service.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && {
          name,
        }),

        ...(description !== undefined && {
          description,
        }),

        ...(duration !== undefined && {
          duration,
        }),

        ...(price !== undefined && {
          price,
        }),

        ...(isActive !== undefined && {
          isActive,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Failed to update service:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update service.",
      },
      { status: 500 },
    );
  }
}
