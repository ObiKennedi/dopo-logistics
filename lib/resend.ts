import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, code: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET") {
  const isVerification = type === "EMAIL_VERIFICATION";
  const subject = isVerification ? "Verify your DOPO Account" : "Reset your DOPO Password";

  await resend.emails.send({
    from: "DOPO Logistics <onboarding@resend.dev>", // Replace with your verified domain in production
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