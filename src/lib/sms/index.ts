export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;

  sendBookingConfirmation(data: {
    phoneNumber: string;
    userName: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void>;

  sendBookingReminder(data: {
    phoneNumber: string;
    userName: string;
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
    userName: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    console.log("[DEV BOOKING SMS]");
    console.log(`Phone: ${data.phoneNumber}`);
    console.log(`User: ${data.userName}`);
    console.log(`Service: ${data.serviceName}`);
    console.log(`Starts: ${data.startsAt.toISOString()}`);
  }

  async sendBookingReminder(data: {
    phoneNumber: string;
    userName: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    console.log("[DEV REMINDER SMS]");
    console.log(`Phone: ${data.phoneNumber}`);
    console.log(`User: ${data.userName}`);
    console.log(`Service: ${data.serviceName}`);
    console.log(`Starts: ${data.startsAt.toISOString()}`);
  }
}

const MELIPAYAMAK_SOAP_URL = "https://api.payamak-panel.com/post/Send.asmx";

function toLocalIranianNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith("+98")) {
    return `0${phoneNumber.slice(3)}`;
  }
  return phoneNumber;
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

class MelipayamakSmsProvider implements SmsProvider {
  private readonly username: string;
  private readonly password: string;
  private readonly otpBodyId: string;
  private readonly bookingBodyId: string;
  private readonly reminderBodyId: string;

  constructor(config: {
    username: string;
    password: string;
    otpBodyId: string;
    bookingBodyId: string;
    reminderBodyId: string;
  }) {
    this.username = config.username;
    this.password = config.password;
    this.otpBodyId = config.otpBodyId;
    this.bookingBodyId = config.bookingBodyId;
    this.reminderBodyId = config.reminderBodyId;
  }

  private async sendSoapPattern(
    to: string,
    bodyId: string,
    args: string[],
    context: string,
  ): Promise<void> {
    // اصلاح نام تگ به username (با n کوچک) مطابق با متد C# ملی‌پیامک
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SendByBaseNumber xmlns="http://tempuri.org/">
      <username>${this.username}</username>
      <password>${this.password}</password>
      <text>
${args.map((arg) => `        <string xmlns="http://tempuri.org/">${arg}</string>`).join("\n")}
      </text>
      <to>${toLocalIranianNumber(to)}</to>
      <bodyId>${bodyId}</bodyId>
    </SendByBaseNumber>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(MELIPAYAMAK_SOAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/SendByBaseNumber",
      },
      body: soapEnvelope,
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Melipayamak SOAP request failed: HTTP ${response.status} - ${rawText.slice(0, 500)}`,
      );
    }

    const match = rawText.match(
      /<SendByBaseNumberResult>(.*?)<\/SendByBaseNumberResult>/,
    );
    const resultValue = match ? match[1].trim() : "";

    console.log(
      `[Melipayamak Response] Context: ${context}, Result: ${resultValue}, Raw XML: ${rawText}`,
    );

    // اگر نتیجه عدد مثبت بزرگ باشد یعنی پیامک با موفقیت صف شده (کد پیگیری است)
    if (!resultValue || Number(resultValue) <= 0) {
      throw new Error(
        `[Melipayamak Error Code: ${resultValue}] ارسال پیامک ناموفق بود. نام کاربری/رمز عبور یا وضعیت الگوی '${bodyId}' را در پنل بررسی کنید.`,
      );
    }
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    await this.sendSoapPattern(phoneNumber, this.otpBodyId, [code], "OTP send");
  }

  async sendBookingConfirmation(data: {
    phoneNumber: string;
    userName: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    const date = formatSalonDate(data.startsAt);
    const time = formatSalonTime(data.startsAt);

    await this.sendSoapPattern(
      data.phoneNumber,
      this.bookingBodyId,
      [data.userName, data.serviceName, date, time],
      "booking confirmation send",
    );
  }

  async sendBookingReminder(data: {
    phoneNumber: string;
    userName: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    const date = formatSalonDate(data.startsAt);
    const time = formatSalonTime(data.startsAt);

    await this.sendSoapPattern(
      data.phoneNumber,
      this.reminderBodyId,
      [data.userName, data.serviceName, date, time],
      "booking reminder send",
    );
  }
}

function createSmsProvider(): SmsProvider {
  const isProduction = process.env.NODE_ENV === "production";

  const username = process.env.MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD;

  const otpBodyId = process.env.MELIPAYAMAK_OTP_BODY_ID || "545244";
  const bookingBodyId = process.env.MELIPAYAMAK_BOOKING_BODY_ID || "545238";
  const reminderBodyId = process.env.MELIPAYAMAK_REMINDER_BODY_ID || "545246";

  if (username && password) {
    return new MelipayamakSmsProvider({
      username,
      password,
      otpBodyId,
      bookingBodyId,
      reminderBodyId,
    });
  }

  if (isProduction) {
    throw new Error(
      "SMS provider is not configured. Set MELIPAYAMAK_USERNAME and MELIPAYAMAK_PASSWORD before running in production.",
    );
  }

  return new DevelopmentSmsProvider();
}

export const smsProvider: SmsProvider = createSmsProvider();
