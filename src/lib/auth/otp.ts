import { createHmac, randomInt } from "crypto";

import { OTP_EXPIRY_SECONDS, OTP_LENGTH } from "./constants";

export function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;

  return randomInt(min, max).toString();
}

export function hashOtp(otp: string): string {
  const salt = process.env.SESSION_SECRET || "melina_default_otp_salt";
  return createHmac("sha256", salt).update(otp).digest("hex");
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
}

export function isOtpExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}
