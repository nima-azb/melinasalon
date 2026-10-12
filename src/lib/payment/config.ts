export const PAYMENT_CONFIG = {
  merchantId:
    process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000",
  isSandbox: process.env.ZARINPAL_SANDBOX === "true",
  depositAmountToman:
    Number(process.env.BOOKING_DEPOSIT_AMOUNT_TOMAN) || 200_000,
  currency: "IRT" as const, // IRT = تومان, IRR = ریال
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

/**
 * قالب‌بندی مبلغ به تومان با اعداد فارسی و جداکننده هزارگان
 */
export function formatTomanPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("fa-IR").format(amount);
  return `${formatted} تومان`;
}
