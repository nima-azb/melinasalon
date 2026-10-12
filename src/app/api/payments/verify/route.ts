import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/payment/zarinpal";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";

// قفل در حافظه برای جلوگیری از پردازش همزمان یک شناسه تراکنش
const inProgressAuthorities = new Set<string>();

export async function POST(request: NextRequest) {
  let authority = "";

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || !("authority" in body)) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه مرجع تراکنش (Authority) الزامی است.",
        },
        { status: 400 },
      );
    }

    authority = String(body.authority);
    const status = "status" in body ? String(body.status) : "";

    // اگر همین درخواست در حال حاضر در حال پردازش است، کمی صبر کنیم تا نتیجه ثبت شود
    if (inProgressAuthorities.has(authority)) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // واکشی اطلاعات اولیه تراکنش از دیتابیس
    const payment = await prisma.payment.findUnique({
      where: { authority },
      include: {
        service: true,
        user: true,
        booking: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "تراکنش مورد نظر یافت نشد.",
        },
        { status: 404 },
      );
    }

    // اگر تراکنش قبلاً تأیید و نهایی شده باشد
    if (payment.status === "PAID" && payment.booking) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        payment: {
          refId: payment.refId,
          amount: payment.amount,
          cardPan: payment.cardPan,
        },
        booking: {
          id: payment.booking.id,
          serviceName: payment.service.name,
          startsAt: payment.startsAt,
        },
      });
    }

    // اگر کاربر در درگاه پرداخت انصراف داده باشد
    if (status.toUpperCase() !== "OK") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        {
          success: false,
          message: "پرداخت توسط کاربر لغو شد یا با خطا مواجه گردید.",
        },
        { status: 400 },
      );
    }

    // علامت‌گذاری شناسه به عنوان در حال پردازش
    inProgressAuthorities.add(authority);

    // ارسال درخواست اعتبارسنجی به وب‌سرویس زرین‌پال
    const verifyResult = await verifyPayment({
      authority: payment.authority,
      amount: payment.amount,
    });

    if (!verifyResult.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        {
          success: false,
          message: verifyResult.error,
        },
        { status: 400 },
      );
    }

    // ثبت نوبت و به‌روزرسانی تراکنش به صورت امن و غیرتکراری در Transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // بررسی مجدد داخل تراکنش در صورتی که درخواست همزمانی قبلاً آن را نهایی کرده باشد
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: {
          booking: {
            include: {
              service: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (currentPayment?.status === "PAID" && currentPayment.booking) {
        return {
          isDuplicate: true,
          booking: currentPayment.booking,
        };
      }

      // ایجاد نوبت جدید
      const newBooking = await tx.booking.create({
        data: {
          userId: payment.userId,
          serviceId: payment.serviceId,
          startsAt: payment.startsAt,
          endsAt: payment.endsAt,
          status: "CONFIRMED",
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // به‌روزرسانی وضعیت پرداخت و الصاق شناسه نوبت
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          refId: verifyResult.refId,
          cardPan: verifyResult.cardPan || null,
          bookingId: newBooking.id,
        },
      });

      return {
        isDuplicate: false,
        booking: newBooking,
      };
    });

    // تنها اگر رزرو تازه ایجاد شده باشد (نه تکراری)، پیامک ارسال می‌شود
    if (!transactionResult.isDuplicate) {
      try {
        const clientName = payment.user.fullName || "کاربر گرامی";

        await smsProvider.sendBookingConfirmation({
          phoneNumber: payment.user.phoneNumber,
          userName: clientName,
          serviceName: transactionResult.booking.service.name,
          startsAt: transactionResult.booking.startsAt,
        });
      } catch (smsError) {
        console.error("Booking confirmation SMS error:", smsError);
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        refId: verifyResult.refId,
        amount: payment.amount,
        cardPan: verifyResult.cardPan,
      },
      booking: {
        id: transactionResult.booking.id,
        serviceName: transactionResult.booking.service.name,
        startsAt: transactionResult.booking.startsAt,
      },
    });
  } catch (error) {
    console.error("POST /api/payments/verify error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "خطای غیرمنتظره در ثبت نوبت و اعتبارسنجی پرداخت.",
      },
      { status: 500 },
    );
  } finally {
    if (authority) {
      inProgressAuthorities.delete(authority);
    }
  }
}
