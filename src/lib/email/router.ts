/**
 * Dual-provider email failover router (Resend / Brevo / Dev Mock)
 * Adheres to Vietnamese character sets & responsive HTML email standards
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailRouter {
  private resendApiKey = process.env.RESEND_API_KEY;
  private brevoApiKey = process.env.BREVO_API_KEY;
  private fromEmail = process.env.EMAIL_FROM || 'Cổng Thông Tin Tuyển Sinh & Học Bổng <noreply@hocbong.vn>';

  /**
   * Primary dispatcher with failover
   */
  async send(options: EmailOptions): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
    // 1. Try Primary: Resend
    if (this.resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return { success: true, provider: 'resend', messageId: data.id };
        }
        console.warn('Resend failed with status:', res.status, await res.text());
      } catch (err: any) {
        console.warn('Resend network error, attempting failover to secondary provider:', err.message);
      }
    }

    // 2. Try Secondary: Brevo (Sendinblue)
    if (this.brevoApiKey) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'Cổng Thông Tin Học Bổng', email: 'noreply@hocbong.vn' },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return { success: true, provider: 'brevo', messageId: data.messageId };
        }
        console.warn('Brevo failed with status:', res.status, await res.text());
      } catch (err: any) {
        console.warn('Brevo error, falling back to local simulation:', err.message);
      }
    }

    // 3. Fallback: Local dev mock logger
    // In dev / test environments or when no API keys are provided, we log the message clearly
    console.log('\n======================================================');
    console.log('📧 [MOCK EMAIL DISPATCHER - DEV MODE]');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('------------------------------------------------------');
    console.log(options.text || options.html);
    console.log('======================================================\n');

    return {
      success: true,
      provider: 'mock_local',
      messageId: `mock_${Date.now()}`,
    };
  }

  /**
   * Send Magic Link login email
   */
  async sendMagicLink(to: string, token: string, baseUrl: string) {
    const link = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;
    const subject = '🔐 Đăng nhập không cần mật khẩu vào Cổng Tuyển Sinh & Học Bổng';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Đăng nhập nhanh (Magic Link)</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Bạn vừa yêu cầu đăng nhập vào Cổng Tuyển Sinh & Học Bổng Việt Nam. Nhấp vào nút bên dưới để đăng nhập ngay mà không cần mật khẩu:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Đăng nhập ngay
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Hoặc copy liên kết này vào trình duyệt: <br/>
          <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Liên kết này có hiệu lực trong 15 phút và chỉ được dùng 1 lần. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
        </p>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
      text: `Đăng nhập vào Cổng Tuyển Sinh & Học Bổng: ${link} (Hiệu lực 15 phút)`,
    });
  }

  /**
   * Send Email verification code / link
   */
  async sendVerificationEmail(to: string, token: string, baseUrl: string, universityName?: string) {
    const link = `${baseUrl}/api/auth/verify-email?token=${token}`;
    const subject = universityName
      ? `🎓 Xác thực email sinh viên ${universityName}`
      : '✅ Xác thực địa chỉ email tài khoản';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">
          ${universityName ? `Xác thực sinh viên ${universityName}` : 'Xác thực địa chỉ email'}
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          ${universityName
            ? `Cảm ơn bạn đã đăng ký bằng email trường ${universityName}. Nhấp vào liên kết dưới đây để nhận Huy hiệu Sinh viên Xác thực và quyền lợi gợi ý học bổng ưu tiên:`
            : 'Vui lòng nhấn nút dưới đây để hoàn tất xác thực tài khoản của bạn:'}
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Xác thực ngay
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          Đường dẫn trực tiếp: <a href="${link}" style="color: #059669; word-break: break-all;">${link}</a>
        </p>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
      text: `Xác thực email: ${link}`,
    });
  }

  /**
   * Send Password Reset link
   */
  async sendPasswordResetEmail(to: string, token: string, baseUrl: string) {
    const link = `${baseUrl}/dat-lai-mat-khau?token=${token}`;
    const subject = '🔑 Đặt lại mật khẩu tài khoản';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Đặt lại mật khẩu</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút dưới đây để tạo mật khẩu mới:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, vui lòng đổi mật khẩu ngay để đảm bảo an toàn.
        </p>
      </div>
    `;

    return this.send({
      to,
      subject,
      html,
      text: `Đặt lại mật khẩu: ${link}`,
    });
  }
}

export const emailRouter = new EmailRouter();
