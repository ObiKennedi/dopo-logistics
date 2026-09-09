import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | DOPO Logistics",
  description: "Request a password reset code for your DOPO Logistics account",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
