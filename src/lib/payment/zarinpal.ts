import { PAYMENT_CONFIG } from "./config";

const BASE_URL = PAYMENT_CONFIG.isSandbox
  ? "https://sandbox.zarinpal.com/pg"
  : "https://payment.zarinpal.com/pg";

const REQUEST_ENDPOINT = `${BASE_URL}/v4/payment/request.json`;
const VERIFY_ENDPOINT = `${BASE_URL}/v4/payment/verify.json`;
const START_PAY_URL = `${BASE_URL}/StartPay/`;

export type PaymentRequestParams = {
  amount: number; // به تومان
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
};

export type PaymentRequestResult =
  | {
      success: true;
      authority: string;
      paymentUrl: string;
      fee: number;
    }
  | {
      success: false;
      error: string;
      code?: number;
    };

export type PaymentVerifyParams = {
  authority: string;
  amount: number; // به تومان
};

export type PaymentVerifyResult =
  | {
      success: true;
      refId: string;
      cardPan?: string;
      cardHash?: string;
      code: number;
      message: string;
    }
  | {
      success: false;
      error: string;
      code?: number;
    };

/**
 * ترجمه کدهای خطای درگاه زرین‌پال به پیام‌های گویای فارسی
 */
function getZarinpalErrorMessage(code: number): string {
  switch (code) {
    case -9:
      return "اطلاعات ارسالی به درگاه نامعتبر است (خطای اعتبارسنجی).";
    case -10:
      return "آی‌پی یا مرچنت‌کد پذیرنده نامعتبر است.";
    case -11:
      return "درگاه پرداخت فعال نیست؛ لطفاً با پشتیبانی تماس بگیرید.";
    case -12:
      return "تعداد درخواست‌ها بیش از حد مجاز در بازه زمانی کوتاه است.";
    case -15:
      return "درگاه پرداخت در حالت تعلیق قرار دارد.";
    case -16:
      return "سطح دسترسی پذیرنده ناکافی است.";
    case -34:
      return "مبلغ تراکنش خارج از سقف مجاز پرداخت است.";
    case -50:
      return "مبلغ پرداخت‌شده با مبلغ درخواست اولیه همخوانی ندارد.";
    case -51:
      return "پرداخت ناموفق بود (انصراف توسط کاربر یا خطای شبکه بانکی).";
    case -52:
      return "خطای غیرمنتظره در سرورهای درگاه پرداخت رخ داده است.";
    case -53:
      return "شناسه تراکنش (Authority) نامعتبر است.";
    case -54:
      return "این تراکنش قبلاً نهایی شده یا زمان آن منقضی گردیده است.";
    default:
      return `خطای پرداخت با کد (${code}).`;
  }
}

/**
 * ۱. درخواست شروع پرداخت و دریافت لینک هدایت به بانک
 */
export async function requestPayment(
  params: PaymentRequestParams,
): Promise<PaymentRequestResult> {
  try {
    const payload = {
      merchant_id: PAYMENT_CONFIG.merchantId,
      amount: params.amount,
      currency: PAYMENT_CONFIG.currency,
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: {
        mobile: params.mobile,
        email: params.email,
      },
    };

    const response = await fetch(REQUEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result?.data || result.data.code !== 100) {
      const errorCode = result?.errors?.code ?? result?.data?.code ?? -1;
      const errorMsg =
        result?.errors?.message ||
        getZarinpalErrorMessage(errorCode) ||
        "ارتباط با درگاه پرداخت ناموفق بود.";

      console.error("[ZARINPAL REQUEST ERROR]:", result);

      return {
        success: false,
        error: errorMsg,
        code: errorCode,
      };
    }

    const authority = String(result.data.authority);
    const paymentUrl = `${START_PAY_URL}${authority}`;

    return {
      success: true,
      authority,
      paymentUrl,
      fee: result.data.fee ?? 0,
    };
  } catch (error) {
    console.error("[ZARINPAL REQUEST EXCEPTION]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "خطا در برقراری ارتباط با درگاه زرین‌پال.",
    };
  }
}

/**
 * ۲. اعتبارسنجی تراکنش پس از بازگشت کاربر از بانک
 */
export async function verifyPayment(
  params: PaymentVerifyParams,
): Promise<PaymentVerifyResult> {
  try {
    const payload = {
      merchant_id: PAYMENT_CONFIG.merchantId,
      amount: params.amount,
      authority: params.authority,
    };

    const response = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = await response.json();

    const code = result?.data?.code ?? result?.errors?.code;

    // کد ۱۰۰ یعنی پرداخت موفق و جدید، کد ۱۰۱ یعنی قبلاً تایید شده است
    if (code === 100 || code === 101) {
      return {
        success: true,
        refId: String(result.data.ref_id),
        cardPan: result.data.card_pan,
        cardHash: result.data.card_hash,
        code,
        message:
          code === 100
            ? "پرداخت با موفقیت انجام شد."
            : "این تراکنش قبلاً تأیید شده است.",
      };
    }

    const errorMsg =
      result?.errors?.message ||
      getZarinpalErrorMessage(code ?? -1) ||
      "اعتبارسنجی پرداخت با خطا مواجه شد.";

    console.error("[ZARINPAL VERIFY ERROR]:", result);

    return {
      success: false,
      error: errorMsg,
      code,
    };
  } catch (error) {
    console.error("[ZARINPAL VERIFY EXCEPTION]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "خطا در اعتبارسنجی تراکنش با سرور زرین‌پال.",
    };
  }
}
