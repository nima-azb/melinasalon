import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceImageKey } from "@/lib/storage/arvan-key";
import { getArvanPublicUrl, uploadToArvan } from "@/lib/storage/arvan-upload";
import {
  MAX_UPLOAD_IMAGE_SIZE,
  getExtensionFromImageType,
  isAllowedImageType,
} from "@/lib/storage/image-validation";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "انتخاب یک فایل تصویر الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!isAllowedImageType(image.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فرمت تصویر پشتیبانی نمی‌شود. لطفاً از فرمت‌های JPEG، PNG یا WebP استفاده کنید.",
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
    const key = createServiceImageKey("uploads", extension);
    const buffer = Buffer.from(await image.arrayBuffer());

    await uploadToArvan({
      key,
      body: buffer,
      contentType: image.type,
      publicRead: true,
    });

    const imageUrl = getArvanPublicUrl(key);

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error("POST /api/admin/services/upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "بارگذاری تصویر در فضای ابری آروان با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
