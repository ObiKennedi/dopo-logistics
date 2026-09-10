import { auth } from "@/auth";
import { UserRequestForm } from "@/components/user/UserRequestForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place a Request | DOPO Logistics",
  description: "Submit an errand, delivery, shopping, or procurement request with DOPO Logistics.",
};

export default async function RequestPage() {
  const session = await auth();

  return (
    <UserRequestForm user={session?.user || null} />
  );
}
