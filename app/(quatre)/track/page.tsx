import { Suspense } from "react";
import { auth } from "@/auth";
import { TrackingView } from "@/components/quatre/TrackingView";
import { Loader } from "@/components/essentials/Loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order | DOPO Logistics",
  description: "Track your delivery, errand, or procurement order in real-time with DOPO Logistics.",
};

export default async function TrackPage() {
  const session = await auth();

  return (
    <Suspense fallback={<Loader message="Opening live tracker…" />}>
      <TrackingView userRole={session?.user?.role} />
    </Suspense>
  );
}
