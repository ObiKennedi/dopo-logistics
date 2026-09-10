"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { TicketStatus, TicketPriority, TicketCategory, Role } from "@prisma/client";

function generateTicketNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TK-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function sendTelegramTicketAlert(
  ticketNumber: string,
  subject: string,
  category: string,
  priority: string,
  customerName: string,
  customerEmail: string,
  description: string,
  orderTracking?: string | null
) {
  const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "";
  const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || "";

  if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN.includes("your_") || CHAT_ID.includes("YOUR_")) {
    return;
  }

  let msg = `🎫 *New Support Ticket Created!*\n\n`;
  msg += `🔢 *Ticket Number:* \`${ticketNumber}\`\n`;
  msg += `👤 *Customer:* ${customerName} (${customerEmail})\n`;
  msg += `📂 *Category:* ${category}\n`;
  msg += `⚡ *Priority:* ${priority}\n`;
  if (orderTracking) {
    msg += `📦 *Linked Order:* \`${orderTracking}\`\n`;
  }
  msg += `📌 *Subject:* ${subject}\n\n`;
  msg += `📝 *Description:*\n${description.slice(0, 500)}${description.length > 500 ? "..." : ""}`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.warn("Telegram ticket alert failed:", err);
  }
}

export async function createTicketAction(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in to submit a support ticket." };
  }

  const subject = (formData.get("subject") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const categoryRaw = (formData.get("category") as string) || "GENERAL";
  const priorityRaw = (formData.get("priority") as string) || "MEDIUM";
  const orderId = (formData.get("orderId") as string)?.trim() || null;

  if (!subject || subject.length < 3) {
    return { error: "Please provide a subject of at least 3 characters." };
  }

  if (!description || description.length < 5) {
    return { error: "Please describe your issue with at least 5 characters." };
  }

  const category = Object.values(TicketCategory).includes(categoryRaw as TicketCategory)
    ? (categoryRaw as TicketCategory)
    : TicketCategory.GENERAL;

  const priority = Object.values(TicketPriority).includes(priorityRaw as TicketPriority)
    ? (priorityRaw as TicketPriority)
    : TicketPriority.MEDIUM;

  const ticketNumber = generateTicketNumber();

  try {
    const isStaff = session.user.role === Role.ADMIN || session.user.role === Role.STAFF;

    // Create the ticket and initial thread message in a single transaction
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        category,
        priority,
        status: TicketStatus.OPEN,
        userId: session.user.id,
        orderId: orderId && orderId !== "none" ? orderId : null,
        messages: {
          create: {
            senderId: session.user.id,
            message: description,
            isStaff,
          },
        },
      },
      include: {
        order: {
          select: {
            trackingNumber: true,
          },
        },
      },
    });

    // Send async alert
    sendTelegramTicketAlert(
      ticket.ticketNumber,
      ticket.subject,
      ticket.category,
      ticket.priority,
      session.user.name || "Customer",
      session.user.email || "No email",
      description,
      ticket.order?.trackingNumber
    ).catch(console.error);

    revalidatePath("/support");

    return {
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      message: "Your support ticket has been created successfully.",
    };
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return { error: "Failed to create support ticket. Please try again." };
  }
}

export async function replyTicketAction(ticketId: string, messageText: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized. Please sign in to reply." };
  }

  const cleanMessage = messageText?.trim();
  if (!cleanMessage) {
    return { error: "Message cannot be empty." };
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true, ticketNumber: true, subject: true },
    });

    if (!ticket) {
      return { error: "Support ticket not found." };
    }

    const isStaff = session.user.role === Role.ADMIN || session.user.role === Role.STAFF;
    const isOwner = ticket.userId === session.user.id;

    if (!isOwner && !isStaff) {
      return { error: "You do not have permission to reply to this ticket." };
    }

    // Determine status transition
    let updatedStatus = ticket.status;
    if (isStaff) {
      // Staff responded -> waiting on customer or marked in-progress
      if (ticket.status === TicketStatus.OPEN) {
        updatedStatus = TicketStatus.IN_PROGRESS;
      }
    } else {
      // Customer responded -> if closed/resolved or waiting, move to IN_PROGRESS
      if (
        ticket.status === TicketStatus.WAITING_FOR_CUSTOMER ||
        ticket.status === TicketStatus.RESOLVED
      ) {
        updatedStatus = TicketStatus.IN_PROGRESS;
      }
    }

    const [newMessage] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: session.user.id,
          message: cleanMessage,
          isStaff,
        },
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
      }),
      prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: updatedStatus,
          updatedAt: new Date(),
          ...(updatedStatus === TicketStatus.CLOSED ? { closedAt: new Date() } : {}),
        },
      }),
    ]);

    revalidatePath("/support");

    return {
      success: true,
      message: {
        id: newMessage.id,
        ticketId: newMessage.ticketId,
        senderId: newMessage.senderId,
        message: newMessage.message,
        isStaff: newMessage.isStaff,
        createdAt: newMessage.createdAt.toISOString(),
        sender: {
          id: newMessage.sender.id,
          name: newMessage.sender.name || (newMessage.isStaff ? "Support Team" : "Customer"),
          email: newMessage.sender.email,
          role: newMessage.sender.role,
          image: newMessage.sender.image,
        },
      },
      newStatus: updatedStatus,
    };
  } catch (error: any) {
    console.error("Error replying to ticket:", error);
    return { error: "Failed to post reply. Please try again." };
  }
}

export async function updateTicketStatusAction(ticketId: string, newStatus: TicketStatus) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized." };
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true },
    });

    if (!ticket) {
      return { error: "Ticket not found." };
    }

    const isStaff = session.user.role === Role.ADMIN || session.user.role === Role.STAFF;
    const isOwner = ticket.userId === session.user.id;

    // Customer can only mark their own ticket as RESOLVED or CLOSED
    if (!isStaff && !isOwner) {
      return { error: "Unauthorized to change status of this ticket." };
    }

    if (!isStaff && newStatus !== TicketStatus.RESOLVED && newStatus !== TicketStatus.CLOSED) {
      return { error: "Only support staff can set this ticket status." };
    }

    const isClosedOrResolved = newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.CLOSED;

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        closedAt: isClosedOrResolved ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/support");

    return {
      success: true,
      newStatus: updated.status,
      closedAt: updated.closedAt ? updated.closedAt.toISOString() : null,
    };
  } catch (error: any) {
    console.error("Error updating ticket status:", error);
    return { error: "Failed to update ticket status." };
  }
}

export async function updateTicketPriorityAction(ticketId: string, newPriority: TicketPriority) {
  const session = await auth();

  if (!session?.user?.id || (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF)) {
    return { error: "Unauthorized. Staff privileges required." };
  }

  try {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        priority: newPriority,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/support");

    return {
      success: true,
      newPriority: updated.priority,
    };
  } catch (error: any) {
    console.error("Error updating ticket priority:", error);
    return { error: "Failed to update ticket priority." };
  }
}

export async function fetchTicketDetailsAction(ticketId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized. Please sign in." };
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
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
    });

    if (!ticket) {
      return { error: "Ticket not found." };
    }

    const isStaff = session.user.role === Role.ADMIN || session.user.role === Role.STAFF;
    const isOwner = ticket.userId === session.user.id;

    if (!isOwner && !isStaff) {
      return { error: "Access denied to this ticket." };
    }

    return {
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
        user: {
          id: ticket.user.id,
          name: ticket.user.name || "Customer",
          email: ticket.user.email,
          role: ticket.user.role,
        },
        order: ticket.order
          ? {
              id: ticket.order.id,
              trackingNumber: ticket.order.trackingNumber,
              serviceType: ticket.order.serviceType,
              status: ticket.order.status,
            }
          : null,
        messages: ticket.messages.map((m) => ({
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
      },
    };
  } catch (error: any) {
    console.error("Error fetching ticket details:", error);
    return { error: "Failed to load ticket details." };
  }
}
