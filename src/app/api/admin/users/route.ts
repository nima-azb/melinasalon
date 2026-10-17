import { NextRequest, NextResponse } from "next/server";

import { UserRole } from "@/generated/prisma/client";
import { normalizeIranianPhone } from "@/lib/auth/phone";
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || !("phoneNumber" in body)) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن همراه کاربر الزامی است.",
        },
        { status: 400 },
      );
    }

    const {
      fullName,
      phoneNumber,
      birthDate: birthDateVal,
      role: roleVal,
    } = body as {
      fullName?: unknown;
      phoneNumber: unknown;
      birthDate?: unknown;
      role?: unknown;
    };

    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن همراه کاربر الزامی است.",
        },
        { status: 400 },
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIranianPhone(phoneNumber);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل وارد شده معتبر نیست. مثال صحیح: ۰۹۱۲۳۴۵۶۷۸۹",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "کاربری با این شماره تلفن قبلاً در سیستم ثبت شده است.",
        },
        { status: 409 },
      );
    }

    let parsedBirthDate: Date | null = null;
    if (typeof birthDateVal === "string" && birthDateVal.trim()) {
      const d = new Date(`${birthDateVal.trim()}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        parsedBirthDate = d;
      }
    }

    const userRole: UserRole =
      roleVal === "ADMIN" ? UserRole.ADMIN : UserRole.USER;

    const user = await prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        fullName:
          typeof fullName === "string" && fullName.trim()
            ? fullName.trim()
            : null,
        birthDate: parsedBirthDate,
        role: userRole,
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        birthDate: true,
        _count: {
          select: {
            bookings: true,
            generations: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "کاربر با موفقیت در سیستم ثبت گردید.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "ثبت کاربر جدید با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
