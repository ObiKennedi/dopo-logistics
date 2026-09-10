import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserProfileView } from "@/components/user/UserProfileView";
import { Loader } from "@/components/essentials/Loader";
import { OrderStatus } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | DOPO Logistics",
  description: "Manage your personal profile, security settings, and DOPO account preferences.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";

  let userRecord = null;
  let totalOrders = 0;
  let activeOrders = 0;
  let totalTickets = 0;

  try {
    if (prisma && prisma.user) {
      userRecord = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });
    }

    if (prisma && prisma.order) {
      const orderCounts = await prisma.order.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail
              ? [{ customerEmail: { equals: userEmail, mode: "insensitive" as const } }]
              : []),
          ],
        },
        select: {
          status: true,
        },
      });

      totalOrders = orderCounts.length;
      activeOrders = orderCounts.filter(
        (o) =>
          o.status === OrderStatus.PENDING ||
          o.status === OrderStatus.CONFIRMED ||
          o.status === OrderStatus.IN_PROGRESS ||
          o.status === OrderStatus.PICKED_UP
      ).length;
    }

    if (prisma && prisma.ticket) {
      totalTickets = await prisma.ticket.count({
        where: { userId },
      });
    }
  } catch (err) {
    console.error("Error fetching user profile data:", err);
  }

  const isOAuthUser = userRecord?.accounts?.some((a) => a.provider === "google") ?? false;

  const userData = {
    id: userRecord?.id || session.user.id,
    name: userRecord?.name || session.user.name || null,
    email: userRecord?.email || session.user.email || "",
    phone: userRecord?.phone || null,
    role: userRecord?.role || session.user.role || "CUSTOMER",
    image: userRecord?.image || session.user.image || null,
    emailVerified: userRecord?.emailVerified ? userRecord.emailVerified.toISOString() : null,
    createdAt: userRecord?.createdAt ? userRecord.createdAt.toISOString() : new Date().toISOString(),
    isOAuthUser,
  };

  const stats = {
    totalOrders,
    activeOrders,
    totalTickets,
  };

  return (
    <Suspense fallback={<Loader message="Loading your profile…" fullscreen={false} />}>
      <UserProfileView user={userData} stats={stats} />
    </Suspense>
  );
}
