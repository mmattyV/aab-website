import nodemailer from "nodemailer";

// Create transporter with Gmail SMTP
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the base URL for the reset link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"AAB Website" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Reset Your AAB Website Password",
      html: getPasswordResetEmailHtml(resetLink),
      text: getPasswordResetEmailText(resetLink),
    };

    await transporter.sendMail(mailOptions);

    console.log("Password reset email sent successfully to:", to);
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// HTML email template
function getPasswordResetEmailHtml(resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #DC2626; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      Harvard Asian American Brotherhood
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 24px;">
                      Reset Your Password
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                      You requested to reset your password for your AAB website account. Click the button below to create a new password.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                      This link will expire in <strong>1 hour</strong> for security reasons.
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background-color: #DC2626; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 4px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; color: #DC2626; font-size: 14px; word-break: break-all;">
                      ${resetLink}
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
                    
                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f5f5f5; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      Harvard Asian American Brotherhood
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      This is an automated email. Please do not reply to this message.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Plain text email template (fallback)
function getPasswordResetEmailText(resetLink: string): string {
  return `
Harvard Asian American Brotherhood

Reset Your Password

You requested to reset your password for your AAB website account.

Click or copy this link to create a new password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

---
Harvard Asian American Brotherhood
This is an automated email. Please do not reply to this message.
  `.trim();
}
