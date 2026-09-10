import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SupportTicketsView } from "@/components/support/SupportTicketsView";
import { Loader } from "@/components/essentials/Loader";
import { Role } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & Inquiries | DOPO Logistics",
  description: "Get assistance, open customer support tickets, and resolve order issues with DOPO Logistics.",
};

export default async function SupportPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";
  const isAdmin = session.user.role === Role.ADMIN || session.user.role === Role.STAFF;

  let serializedTickets: any[] = [];
  let userOrders: any[] = [];

  try {
    if (prisma && prisma.ticket) {
      const tickets = await prisma.ticket.findMany({
        where: isAdmin ? {} : { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          },
          order: {
            select: {
              id: true,
              trackingNumber: true,
              serviceType: true,
              status: true,
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      serializedTickets = tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        closedAt: t.closedAt ? t.closedAt.toISOString() : null,
        user: {
          id: t.user.id,
          name: t.user.name || "Customer",
          email: t.user.email,
          role: t.user.role,
          image: t.user.image,
        },
        order: t.order
          ? {
              id: t.order.id,
              trackingNumber: t.order.trackingNumber,
              serviceType: t.order.serviceType,
              status: t.order.status,
            }
          : null,
        messages: t.messages.map((m) => ({
          id: m.id,
          ticketId: m.ticketId,
          senderId: m.senderId,
          message: m.message,
          isStaff: m.isStaff,
          createdAt: m.createdAt.toISOString(),
          sender: {
            id: m.sender.id,
            name: m.sender.name || (m.isStaff ? "Support Team" : "Customer"),
            email: m.sender.email,
            role: m.sender.role,
            image: m.sender.image,
          },
        })),
      }));
    }

    if (prisma && prisma.order) {
      userOrders = await prisma.order.findMany({
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
        take: 10,
      });
    }
  } catch (error) {
    console.error("Error fetching support tickets or orders:", error);
    serializedTickets = [];
    userOrders = [];
  }

  return (
    <Suspense fallback={<Loader message="Loading support center…" fullscreen={false} />}>
      <SupportTicketsView
        initialTickets={serializedTickets}
        userOrders={userOrders}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />
    </Suspense>
  );
}
