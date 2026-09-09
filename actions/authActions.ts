"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { sendOTPEmail } from "@/lib/resend";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

// Helper to generate 6-digit OTP
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------------------------------------------------
// 1. SIGN UP ACTION
// -------------------------------------------------------------
export async function signUpAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  // Generate OTP
  const code = generateOTPCode();
  await prisma.oTP.create({
    data: {
      code,
      email,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      userId: user.id,
    },
  });

  // Send Email
  await sendOTPEmail(email, code, "EMAIL_VERIFICATION");

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

// -------------------------------------------------------------
// 2. LOGIN ACTION
// -------------------------------------------------------------
export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return { error: "Invalid credentials." };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { error: "Invalid credentials." };
  }

  // Enforce Email Verification
  if (!user.emailVerified) {
    // Generate new OTP if necessary
    const code = generateOTPCode();
    await prisma.oTP.create({
      data: {
        code,
        email,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        userId: user.id,
      },
    });

    await sendOTPEmail(email, code, "EMAIL_VERIFICATION");
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/redirect",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Authentication failed." };
    }
    throw error; // Re-throw to handle Next.js internal redirects correctly
  }
}

// -------------------------------------------------------------
// 3. VERIFY EMAIL OTP ACTION
// -------------------------------------------------------------
export async function verifyEmailOTPAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;

  const validOtp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      type: "EMAIL_VERIFICATION",
      expiresAt: { gt: new Date() },
    },
  });

  if (!validOtp) {
    return { error: "Invalid or expired OTP." };
  }

  // Update user as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Cleanup OTPs
  await prisma.oTP.deleteMany({ where: { email, type: "EMAIL_VERIFICATION" } });

  redirect("/login?verified=true");
}

// -------------------------------------------------------------
// 4. FORGOTTEN PASSWORD ACTIONS
// -------------------------------------------------------------
export async function requestPasswordResetAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email address is required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Return success message to avoid email enumeration
    return { success: "If an account exists, a reset code has been sent." };
  }

  const code = generateOTPCode();
  await prisma.oTP.create({
    data: {
      code,
      email,
      type: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      userId: user.id,
    },
  });

  await sendOTPEmail(email, code, "PASSWORD_RESET");

  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

export async function resetPasswordWithOTPAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;
  const newPassword = formData.get("newPassword") as string;

  const validOtp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      type: "PASSWORD_RESET",
      expiresAt: { gt: new Date() },
    },
  });

  if (!validOtp) {
    return { error: "Invalid or expired reset code." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await prisma.oTP.deleteMany({ where: { email, type: "PASSWORD_RESET" } });

  redirect("/login?reset=success");
}