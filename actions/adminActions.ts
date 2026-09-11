"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { Role, OrderStatus, ServiceType, TicketStatus, TicketPriority } from "@prisma/client";

// Helper to ensure admin or staff authorization
async function ensureAdminOrStaff() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: "You must be signed in to perform administrative actions." };
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    return { authorized: false, error: "Access denied. Elevated administrative permissions required." };
  }
  return { authorized: true, user: session.user };
}

// --------------------------------------------------------------------------
// 1. FETCH PLATFORM-WIDE DASHBOARD DATA
// --------------------------------------------------------------------------
export async function fetchAdminDashboardDataAction() {
  const authCheck = await ensureAdminOrStaff();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  try {
    // 1. Fetch Users with counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch Orders
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // 3. Fetch Support Tickets
    const tickets = await prisma.ticket.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            trackingNumber: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            message: true,
            createdAt: true,
            isStaff: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // 4. Calculate KPI statistics
    const roleCounts = {
      CUSTOMER: users.filter((u) => u.role === "CUSTOMER").length,
      STAFF: users.filter((u) => u.role === "STAFF").length,
      ADMIN: users.filter((u) => u.role === "ADMIN").length,
    };

    const orderStatusCounts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      PICKED_UP: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    orders.forEach((o) => {
      if (orderStatusCounts[o.status] !== undefined) {
        orderStatusCounts[o.status]++;
      }
    });

    const ticketStatusCounts: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_CUSTOMER: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    tickets.forEach((t) => {
      if (ticketStatusCounts[t.status] !== undefined) {
        ticketStatusCounts[t.status]++;
      }
    });

    // Serialize dates for Client Component safety
    const serializedUsers = users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      emailVerified: u.emailVerified ? u.emailVerified.toISOString() : null,
      ordersCount: u._count.orders,
      ticketsCount: u._count.tickets,
    }));

    const serializedOrders = orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      checkInDate: o.checkInDate ? o.checkInDate.toISOString() : null,
      checkOutDate: o.checkOutDate ? o.checkOutDate.toISOString() : null,
    }));

    const serializedTickets = tickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      closedAt: t.closedAt ? t.closedAt.toISOString() : null,
      lastMessage: t.messages[0]
        ? {
            message: t.messages[0].message,
            createdAt: t.messages[0].createdAt.toISOString(),
            isStaff: t.messages[0].isStaff,
          }
        : null,
    }));

    return {
      success: true,
      data: {
        stats: {
          totalUsers: users.length,
          roleCounts,
          totalOrders: orders.length,
          orderStatusCounts,
          totalTickets: tickets.length,
          ticketStatusCounts,
          guestOrdersCount: orders.filter((o) => !o.userId).length,
        },
        users: serializedUsers,
        orders: serializedOrders,
        tickets: serializedTickets,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch admin dashboard data:", error);
    return { error: "Failed to load admin dashboard records. Please try again." };
  }
}

// --------------------------------------------------------------------------
// 2. FETCH DETAILED USER 360° PROFILE (Orders & Tickets)
// --------------------------------------------------------------------------
export async function fetchUserDetailsAction(userId: string) {
  const authCheck = await ensureAdminOrStaff();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!user) {
      return { error: "User not found." };
    }

    // Fetch all orders linked to user ID or email
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(user.email ? [{ customerEmail: { equals: user.email, mode: "insensitive" as const } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all tickets created by this user
    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        order: {
          select: { trackingNumber: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            message: true,
            createdAt: true,
            isStaff: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
        emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        providers: user.accounts.map((a) => a.provider),
      },
      orders: orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        checkInDate: o.checkInDate ? o.checkInDate.toISOString() : null,
        checkOutDate: o.checkOutDate ? o.checkOutDate.toISOString() : null,
      })),
      tickets: tickets.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        closedAt: t.closedAt ? t.closedAt.toISOString() : null,
        lastMessage: t.messages[0]
          ? {
              message: t.messages[0].message,
              createdAt: t.messages[0].createdAt.toISOString(),
              isStaff: t.messages[0].isStaff,
            }
          : null,
      })),
    };
  } catch (error: any) {
    console.error("Failed to fetch user details:", error);
    return { error: "Failed to load user profile details." };
  }
}

// --------------------------------------------------------------------------
// 3. UPDATE USER ROLE (Admin only)
// --------------------------------------------------------------------------
export async function updateUserRoleAction(userId: string, newRole: Role) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized. Administrator privileges required to change user roles." };
  }

  if (session.user.id === userId && newRole !== "ADMIN") {
    return { error: "You cannot demote your own administrator account." };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      user: updatedUser,
      message: `Updated role for ${updatedUser.name || updatedUser.email} to ${newRole}.`,
    };
  } catch (error: any) {
    console.error("Failed to update user role:", error);
    return { error: "Failed to update user role. Please try again." };
  }
}

// --------------------------------------------------------------------------
// 4. FETCH ALL PLATFORM ORDERS FOR ADMIN ORDERS CONSOLE
// --------------------------------------------------------------------------
export async function fetchAdminOrdersAction() {
  const authCheck = await ensureAdminOrStaff();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute stats for orders
    const statusCounts: Record<string, number> = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      PICKED_UP: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    let guestOrdersCount = 0;
    orders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
      if (!o.userId) {
        guestOrdersCount++;
      }
    });

    const serializedOrders = orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      checkInDate: o.checkInDate ? o.checkInDate.toISOString() : null,
      checkOutDate: o.checkOutDate ? o.checkOutDate.toISOString() : null,
    }));

    return {
      success: true,
      data: {
        orders: serializedOrders,
        stats: {
          total: orders.length,
          statusCounts,
          guestOrdersCount,
          registeredOrdersCount: orders.length - guestOrdersCount,
        },
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch admin orders:", error);
    return { error: "Failed to load platform orders records. Please try again." };
  }
}

