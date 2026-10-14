import { NextRequest, NextResponse } from "next/server";

import { UserRole } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() ?? "";
    const roleParam = searchParams.get("role")?.trim();
    const role: UserRole | undefined =
      roleParam === "USER" || roleParam === "ADMIN"
        ? (roleParam as UserRole)
        : undefined;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
    const limit = limitParam
      ? Math.min(100, Math.max(1, Number(limitParam)))
      : 15;
    const skip = (page - 1) * limit;

    const where = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                phoneNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              generations: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت لیست کاربران با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
