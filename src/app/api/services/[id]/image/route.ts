import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { createServiceImageKey } from "@/lib/storage/arvan-key";
import {
  deleteFromArvan,
  getArvanKeyFromPublicUrl,
  getArvanPublicUrl,
  uploadToArvan,
} from "@/lib/storage/arvan-upload";
import {
  MAX_UPLOAD_IMAGE_SIZE,
  getExtensionFromImageType,
  isAllowedImageType,
} from "@/lib/storage/image-validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/** Best-effort cleanup — a failed delete of the old image should never block updating the new one. */
async function deleteServiceImageIfAny(imageUrl: string | null) {
  if (!imageUrl) {
    return;
  }

  const key = getArvanKeyFromPublicUrl(imageUrl);

  if (!key) {
    return;
  }

  try {
    await deleteFromArvan(key);
  } catch (error) {
    console.error("Failed to delete old service image:", error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "خدمت مورد نظر یافت نشد.",
        },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "انتخاب یک تصویر الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!isAllowedImageType(image.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فرمت تصویر پشتیبانی نمی‌شود. از JPEG، PNG یا WebP استفاده کنید.",
        },
        { status: 400 },
      );
    }

    if (image.size <= 0 || image.size > MAX_UPLOAD_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "حجم تصویر باید حداکثر ۱۰ مگابایت باشد.",
        },
        { status: 400 },
      );
    }

    const extension = getExtensionFromImageType(image.type);
    const key = createServiceImageKey(id, extension);
    const buffer = Buffer.from(await image.arrayBuffer());

    await uploadToArvan({
      key,
      body: buffer,
      contentType: image.type,
      publicRead: true,
    });

    const imageUrl = getArvanPublicUrl(key);

    const service = await prisma.service.update({
      where: { id },
      data: { imageUrl },
    });

    // Clean up the previous image only after the new one is safely stored
    // and the DB row is updated, so a mid-request failure never leaves the
    // service without any image at all.
    await deleteServiceImageIfAny(existingService.imageUrl);

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("POST /api/services/[id]/image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "بارگذاری تصویر خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "خدمت مورد نظر یافت نشد.",
        },
        { status: 404 },
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: { imageUrl: null },
    });

    await deleteServiceImageIfAny(existingService.imageUrl);

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("DELETE /api/services/[id]/image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حذف تصویر خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
