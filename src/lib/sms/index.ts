export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;

  sendBookingConfirmation(data: {
    phoneNumber: string;
    serviceName: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
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
}

export const smsProvider: SmsProvider = new DevelopmentSmsProvider();
