import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserTrackingView } from "@/components/user/UserTrackingView";
import { Loader } from "@/components/essentials/Loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order | DOPO Dashboard",
  description: "Live package and order tracking for DOPO Logistics customers.",
};

export default async function UserTrackPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userEmail = session.user.email || "";
  const userId = session.user.id;

  let recentOrders: Array<{
    id: string;
    trackingNumber: string;
    serviceType: import("@prisma/client").ServiceType;
    status: import("@prisma/client").OrderStatus;
  }> = [];

  try {
    if (prisma && prisma.order) {
      recentOrders = await prisma.order.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail
              ? [{ customerEmail: { equals: userEmail, mode: "insensitive" as const } }]
              : []),
          ],
        },
        select: {
          id: true,
          trackingNumber: true,
          serviceType: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      });
    }
  } catch (error) {
    console.error("Error fetching recent orders for user-track:", error);
    recentOrders = [];
  }

  return (
    <Suspense fallback={<Loader message="Loading shipment tracker…" fullscreen={false} />}>
      <UserTrackingView
        userOrders={recentOrders}
        userRole={session.user.role}
      />
    </Suspense>
  );
}
