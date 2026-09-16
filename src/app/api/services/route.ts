import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  duration: z.number().int().positive().max(480),
});

async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      ),
      user: null,
    };
  }

  if (user.role !== "ADMIN") {
    return {
      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 },
      ),
      user: null,
    };
  }

  return {
    response: null,
    user,
  };
}

export async function GET(request: NextRequest) {
  try {
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    if (includeInactive) {
      const admin = await requireAdminUser();

      if (admin.response) {
        return admin.response;
      }
    }

    const services = await prisma.service.findMany({
      where: includeInactive
        ? undefined
        : {
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
    console.error("GET /api/services error:", error);

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
    const admin = await requireAdminUser();

    if (admin.response) {
      return admin.response;
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
    console.error("POST /api/services error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service.",
      },
      { status: 500 },
    );
  }
}
