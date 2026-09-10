import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, code: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET") {
  const isVerification = type === "EMAIL_VERIFICATION";
  const subject = isVerification ? "Verify your DOPO Account" : "Reset your DOPO Password";

  await resend.emails.send({
    from: "DOPO Logistics <onboarding@resend.dev>",
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>${subject}</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 10px 20px; display: inline-block; letter-spacing: 4px;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(email: string, trackingNumber: string, service: string, name: string) {
  try {
    await resend.emails.send({
      from: "DOPO Logistics <onboarding@resend.dev>",
      to: email,
      subject: `DOPO Order Confirmation - ${trackingNumber}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #0a1854;">
          <h2>Request Received Successfully!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for trusting DOPO Logistics. We have received your request for <strong>${service}</strong>.</p>
          <p>Your tracking number is:</p>
          <h2 style="background: #eff6ff; color: #1d4ed8; padding: 10px 18px; display: inline-block; border-radius: 8px; letter-spacing: 2px;">${trackingNumber}</h2>
          <p>Our team is reviewing your request and will reach out to you shortly.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn("Order confirmation email notice:", err);
  }
}