import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register | DOPO Logistics",
  description: "Create an account with DOPO Logistics",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
