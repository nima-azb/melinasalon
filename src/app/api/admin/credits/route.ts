import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";

const AVALAI_CREDIT_ENDPOINT = "https://api.avalai.ir/user/v1/credit";
const MELIPAYAMAK_SOAP_ENDPOINT =
  "https://api.payamak-panel.com/post/Send.asmx";
const MELIPAYAMAK_REST_ENDPOINT =
  "https://rest.payamak-panel.com/api/SendSMS/GetCredit";

const FETCH_TIMEOUT_MS = 8000;

// Short 20-second cache to protect AvalAI & Melipayamak rate limits against accidental rapid reloads.
let cachedResult: {
  timestamp: number;
  data: AdminCreditsResponse;
} | null = null;
const CACHE_TTL_MS = 20_000;

export type ProviderCreditStatus = "ok" | "low" | "depleted" | "error";

export type AvalaiCreditData = {
  configured: boolean;
  remainingIrt: number;
  formattedIrt: string;
  accountTier: number;
  exchangeRate: number;
  status: ProviderCreditStatus;
  statusText: string;
  error?: string | null;
};

export type MelipayamakCreditData = {
  configured: boolean;
  rawCredit: number;
  displayValue: string;
  unit: "پیامک" | "تومان";
  status: ProviderCreditStatus;
  statusText: string;
  error?: string | null;
};

export type AdminCreditsResponse = {
  success: boolean;
  updatedAt: string;
  avalai: AvalaiCreditData;
  melipayamak: MelipayamakCreditData;
  hasLowBalanceWarning: boolean;
};

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

async function fetchAvalaiCredit(): Promise<AvalaiCreditData> {
  const apiKey = process.env.AVALAI_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      remainingIrt: 0,
      formattedIrt: "تنظیم‌نشده",
      accountTier: 0,
      exchangeRate: 0,
      status: "error",
      statusText: "کلید API ثبت نشده است",
      error: "متغیر AVALAI_API_KEY در فایل .env تعریف نشده است.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(AVALAI_CREDIT_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        configured: true,
        remainingIrt: 0,
        formattedIrt: "خطا",
        accountTier: 0,
        exchangeRate: 0,
        status: "error",
        statusText: `خطای سرور (${response.status})`,
        error: `پاسخ ناموفق از AvalAI: کد ${response.status} - ${errText.slice(0, 150)}`,
      };
    }

    const data = await response.json();
    const remainingIrt = Number(data.remaining_irt ?? 0);
    const accountTier = Number(data.account_tier ?? 0);
    const exchangeRate = Number(data.exchange_rate ?? 0);

    let status: ProviderCreditStatus = "ok";
    let statusText = "عادی";

    if (remainingIrt <= 0) {
      status = "depleted";
      statusText = "اتمام اعتبار";
    } else if (remainingIrt < 20_000) {
      status = "low";
      statusText = "اعتبار رو به اتمام";
    }

    return {
      configured: true,
      remainingIrt,
      formattedIrt: Math.floor(remainingIrt).toLocaleString("fa-IR"),
      accountTier,
      exchangeRate,
      status,
      statusText,
      error: null,
    };
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === "AbortError";
    return {
      configured: true,
      remainingIrt: 0,
      formattedIrt: "خطای ارتباط",
      accountTier: 0,
      exchangeRate: 0,
      status: "error",
      statusText: isTimeout ? "مهلت زمانی اتصال پایان یافت" : "خطای شبکه",
      error:
        error instanceof Error
          ? error.message
          : "خطای ناشناخته در ارتباط با AvalAI",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchMelipayamakCredit(): Promise<MelipayamakCreditData> {
  const username = process.env.MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD;

  if (!username || !password) {
    return {
      configured: false,
      rawCredit: 0,
      displayValue: "تنظیم‌نشده",
      unit: "پیامک",
      status: "error",
      statusText: "اطلاعات پنل ثبت نشده است",
      error: "نام کاربری یا رمز عبور ملی‌پیامک در .env تعریف نشده است.",
    };
  }

  // 1. First attempt: SOAP GetCredit (primary and fast)
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCredit xmlns="http://tempuri.org/">
      <username>${escapeXml(username)}</username>
      <password>${escapeXml(password)}</password>
    </GetCredit>
  </soap:Body>
</soap:Envelope>`;

  let creditValue: number | null = null;
  let lastError: string | null = null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const soapResponse = await fetch(MELIPAYAMAK_SOAP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/GetCredit",
      },
      body: soapEnvelope,
      signal: controller.signal,
      cache: "no-store",
    });

    if (soapResponse.ok) {
      const xmlText = await soapResponse.text();
      const match = xmlText.match(/<GetCreditResult>(.*?)<\/GetCreditResult>/);
      if (match && match[1]) {
        const parsed = Number(match[1].trim());
        if (!Number.isNaN(parsed)) {
          creditValue = parsed;
        }
      }
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : "SOAP request failed";
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. Second attempt: Fallback to REST endpoint if SOAP returned invalid value
  if (creditValue === null) {
    const restController = new AbortController();
    const restTimeoutId = setTimeout(
      () => restController.abort(),
      FETCH_TIMEOUT_MS,
    );

    try {
      const restResponse = await fetch(MELIPAYAMAK_REST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        signal: restController.signal,
        cache: "no-store",
      });

      if (restResponse.ok) {
        const restData = (await restResponse.json()) as {
          Value?: string | number;
          RetStatus?: number;
          StrRetStatus?: string;
        };

        if (restData.Value !== undefined) {
          const parsed = Number(restData.Value);
          if (!Number.isNaN(parsed)) {
            creditValue = parsed;
          }
        }
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "REST request failed";
    } finally {
      clearTimeout(restTimeoutId);
    }
  }

  // If both methods failed
  if (creditValue === null) {
    return {
      configured: true,
      rawCredit: 0,
      displayValue: "خطای ارتباط",
      unit: "پیامک",
      status: "error",
      statusText: "خطا در دریافت اعتبار",
      error: lastError || "پاسخ معتبری از وب‌سرویس ملی‌پیامک دریافت نشد.",
    };
  }

  // Check for negative Melipayamak error return codes
  if (creditValue < 0) {
    return {
      configured: true,
      rawCredit: creditValue,
      displayValue: `کد خطا: ${creditValue}`,
      unit: "پیامک",
      status: "error",
      statusText: "نام کاربری یا رمز عبور نامعتبر",
      error: `کد خطای ملی‌پیامک: ${creditValue}. مشخصات ورود را بررسی کنید.`,
    };
  }

  // Determine whether the value is in SMS count or in Rials
  // In Melipayamak: values <= 1,000 represent SMS count; values > 1,000 represent Rials.
  const isSmsCount = creditValue <= 1000;

  if (isSmsCount) {
    const smsCount = Math.floor(creditValue);
    let status: ProviderCreditStatus = "ok";
    let statusText = "عادی";

    if (smsCount <= 0) {
      status = "depleted";
      statusText = "اتمام اعتبار پیامک";
    } else if (smsCount < 20) {
      status = "low";
      statusText = "اعتبار پیامک کم";
    }

    return {
      configured: true,
      rawCredit: creditValue,
      displayValue: smsCount.toLocaleString("fa-IR"),
      unit: "پیامک",
      status,
      statusText,
      error: null,
    };
  }

  // Otherwise, credit is in Rials -> convert to Tomans
  const creditTomans = Math.floor(creditValue / 10);
  let status: ProviderCreditStatus = "ok";
  let statusText = "عادی";

  if (creditTomans <= 0) {
    status = "depleted";
    statusText = "اتمام اعتبار ریالی";
  } else if (creditTomans < 30_000) {
    status = "low";
    statusText = "اعتبار ریالی رو به اتمام";
  }

  return {
    configured: true,
    rawCredit: creditValue,
    displayValue: creditTomans.toLocaleString("fa-IR"),
    unit: "تومان",
    status,
    statusText,
    error: null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";
    const now = Date.now();

    if (
      !forceRefresh &&
      cachedResult &&
      now - cachedResult.timestamp < CACHE_TTL_MS
    ) {
      return NextResponse.json(cachedResult.data);
    }

    const [avalai, melipayamak] = await Promise.all([
      fetchAvalaiCredit(),
      fetchMelipayamakCredit(),
    ]);

    const hasLowBalanceWarning =
      avalai.status === "depleted" ||
      avalai.status === "low" ||
      melipayamak.status === "depleted" ||
      melipayamak.status === "low";

    const responseData: AdminCreditsResponse = {
      success: true,
      updatedAt: new Date().toISOString(),
      avalai,
      melipayamak,
      hasLowBalanceWarning,
    };

    cachedResult = {
      timestamp: now,
      data: responseData,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/admin/credits error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت اطلاعات اعتبار سرویس‌ها با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
