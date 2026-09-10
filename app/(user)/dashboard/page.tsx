import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/user/OrdersTable";
import { Order } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | DOPO Logistics",
  description: "View and manage your DOPO Logistics orders and errand requests.",
};

export default async function UserDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userEmail = session.user.email || "";
  const userId = session.user.id;

  let orders: Order[] = [];

  try {
    if (prisma && prisma.order) {
      orders = await prisma.order.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail
              ? [{ customerEmail: { equals: userEmail, mode: "insensitive" as const } }]
              : []),
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching user orders:", error);
    orders = [];
  }

  return (
    <OrdersTable
      orders={orders}
      userName={session.user.name || userEmail.split("@")[0]}
    />
  );
}