import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  duration: z.number().int().positive().max(480),
  price: z.number().int().nonnegative().optional(),
});

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Failed to fetch services:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch services.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();
    const result = createServiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service data.",
          errors: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const service = await prisma.service.create({
      data: {
        name: result.data.name,
        description: result.data.description || null,
        duration: result.data.duration,
        price: result.data.price ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        service,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create service:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service.",
      },
      { status: 500 },
    );
  }
}
