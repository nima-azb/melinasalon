export interface SmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;
}

class DevelopmentSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[DEV OTP] ${phoneNumber}: ${code}`);
  }
}

export const smsProvider: SmsProvider = new DevelopmentSmsProvider();
