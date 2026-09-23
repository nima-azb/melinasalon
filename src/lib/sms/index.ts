export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;

  sendBookingConfirmation(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
  }): Promise<void>;

  sendBookingReminder(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void>;
}

class DevelopmentSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[DEV OTP] ${phoneNumber}: ${code}`);
  }

  async sendBookingConfirmation(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
  }): Promise<void> {
    console.log("[DEV BOOKING SMS]");
    console.log(`Phone: ${data.phoneNumber}`);
    console.log(`Service: ${data.serviceName}`);
    console.log(`Starts: ${data.startsAt.toISOString()}`);
    console.log(`Ends: ${data.endsAt.toISOString()}`);
    console.log(`Status: ${data.status}`);
  }

  async sendBookingReminder(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    console.log("[DEV REMINDER SMS]");
    console.log(`Phone: ${data.phoneNumber}`);
    console.log(`Service: ${data.serviceName}`);
    console.log(`Starts: ${data.startsAt.toISOString()}`);
  }
}

const MELIPAYAMAK_BASE_URL = "https://rest.payamak-panel.com/api/SendSMS";

type MelipayamakResponse = {
  Value?: string | number;
  RetStatus?: number;
  StrRetStatus?: string;
};

/**
 * "+989121234567" -> "09121234567"
 *
 * This is the local Iranian phone-number format expected by
 * the Melipayamak API.
 */
function toLocalIranianNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith("+98")) {
    return `0${phoneNumber.slice(3)}`;
  }

  return phoneNumber;
}

function formatSalonDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatSalonDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "full",
  }).format(date);
}

function formatSalonTime(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    timeStyle: "short",
  }).format(date);
}

function formatBookingStatus(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "تایید شد";

    case "CANCELLED":
      return "لغو شد";

    case "COMPLETED":
      return "انجام شد";

    default:
      return status;
  }
}

async function assertMelipayamakSuccess(
  response: Response,
  context: string,
): Promise<void> {
  if (!response.ok) {
    const rawText = await response.text();

    throw new Error(
      `Melipayamak ${context} failed (HTTP ${response.status}): ${rawText.slice(
        0,
        500,
      )}`,
    );
  }

  const data = (await response.json()) as MelipayamakResponse;

  if (data.RetStatus !== undefined && data.RetStatus !== 1) {
    throw new Error(
      `Melipayamak ${context} failed: ${
        data.StrRetStatus ?? "unknown error"
      } (RetStatus=${data.RetStatus}, Value=${data.Value})`,
    );
  }

  /*
   * Defensive fallback for responses that omit RetStatus but return
   * a negative error code through Value.
   */
  if (
    data.RetStatus === undefined &&
    typeof data.Value === "string" &&
    /^-\d+$/.test(data.Value.trim())
  ) {
    throw new Error(
      `Melipayamak ${context} failed with error code ${data.Value}`,
    );
  }
}

class MelipayamakSmsProvider implements SmsProvider {
  private readonly username: string;
  private readonly password: string;
  private readonly otpBodyId: string;
  private readonly senderNumber: string;

  constructor(config: {
    username: string;
    password: string;
    otpBodyId: string;
    senderNumber: string;
  }) {
    this.username = config.username;
    this.password = config.password;
    this.otpBodyId = config.otpBodyId;
    this.senderNumber = config.senderNumber;
  }

  private async sendPlain(
    to: string,
    text: string,
    context: string,
  ): Promise<void> {
    const body = new URLSearchParams({
      username: this.username,
      password: this.password,
      to: toLocalIranianNumber(to),
      from: this.senderNumber,
      text,
      isFlash: "false",
    });

    const response = await fetch(`${MELIPAYAMAK_BASE_URL}/SendSMS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    await assertMelipayamakSuccess(response, context);
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const body = new URLSearchParams({
      username: this.username,
      password: this.password,
      text: code,
      to: toLocalIranianNumber(phoneNumber),
      bodyId: this.otpBodyId,
    });

    const response = await fetch(`${MELIPAYAMAK_BASE_URL}/BaseServiceNumber`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    await assertMelipayamakSuccess(response, "OTP send");
  }

  async sendBookingConfirmation(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
  }): Promise<void> {
    const message = [
      "سالن ملینا",
      `سرویس: ${data.serviceName}`,
      `زمان: ${formatSalonDateTime(data.startsAt)}`,
      `وضعیت رزرو: ${formatBookingStatus(data.status)}`,
    ].join("\n");

    await this.sendPlain(
      data.phoneNumber,
      message,
      "booking confirmation send",
    );
  }

  async sendBookingReminder(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    const message = [
      "سالن ملینا",
      "یادآوری نوبت فردا:",
      `سرویس: ${data.serviceName}`,
      `تاریخ: ${formatSalonDate(data.startsAt)}`,
      `ساعت: ${formatSalonTime(data.startsAt)}`,
    ].join("\n");

    await this.sendPlain(data.phoneNumber, message, "booking reminder send");
  }
}

function createSmsProvider(): SmsProvider {
  const isProduction = process.env.NODE_ENV === "production";

  const username = process.env.MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD;
  const otpBodyId = process.env.MELIPAYAMAK_OTP_BODY_ID;
  const senderNumber = process.env.MELIPAYAMAK_SENDER_NUMBER;

  if (username && password && otpBodyId && senderNumber) {
    return new MelipayamakSmsProvider({
      username,
      password,
      otpBodyId,
      senderNumber,
    });
  }

  if (isProduction) {
    throw new Error(
      "SMS provider is not configured. Set MELIPAYAMAK_USERNAME, " +
        "MELIPAYAMAK_PASSWORD, MELIPAYAMAK_OTP_BODY_ID and " +
        "MELIPAYAMAK_SENDER_NUMBER before running in production.",
    );
  }

  return new DevelopmentSmsProvider();
}

export const smsProvider: SmsProvider = createSmsProvider();
