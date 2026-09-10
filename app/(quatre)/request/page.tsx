import { Suspense } from "react";
import { RequestForm } from "@/components/quatre/RequestForm";
import { Loader } from "@/components/essentials/Loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place an Order | DOPO Logistics",
  description: "Request an errand, delivery, shopping assistance, procurement, or hotel reservation with DOPO Logistics.",
};

export default function GuestRequestPage() {
  return (
    <Suspense fallback={<Loader message="Opening request form…" />}>
      <RequestForm />
    </Suspense>
  );
}
