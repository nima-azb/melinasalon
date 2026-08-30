import { z } from "zod";

const iranianPhoneSchema = z.string().trim().min(10).max(15);

function convertToEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizeIranianPhone(phone: string): string {
  const value = phone.trim().replace(/[\s-]/g, "");

  if (!iranianPhoneSchema.safeParse(value).success) {
    throw new Error("Invalid phone number");
  }

  const normalizedDigits = convertToEnglishDigits(value);

  if (/^09\d{9}$/.test(normalizedDigits)) {
    return `+98${normalizedDigits.slice(1)}`;
  }

  if (/^989\d{9}$/.test(normalizedDigits)) {
    return `+${normalizedDigits}`;
  }

  if (/^\+989\d{9}$/.test(normalizedDigits)) {
    return normalizedDigits;
  }

  throw new Error("Invalid Iranian phone number");
}

export function isValidIranianPhone(phone: string): boolean {
  try {
    normalizeIranianPhone(phone);
    return true;
  } catch {
    return false;
  }
}
