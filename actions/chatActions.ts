"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ChatStatus, SenderType, Role } from "@prisma/client";

async function ensureAdminOrStaff() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: "You must be signed in to manage chats." };
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) {
    return { authorized: false, error: "Access denied. Administrative permissions required." };
  }
  return { authorized: true, user: session.user };
}

// --------------------------------------------------------------------------
// 1. FETCH ALL LIVE CUSTOMER CHATS
// --------------------------------------------------------------------------
export async function fetchAdminChatsAction() {
  const authCheck = await ensureAdminOrStaff();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  try {
    const chatSessions = await prisma.chatSession.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
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
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const statusCounts: Record<string, number> = {
      ALL: chatSessions.length,
      ACTIVE: 0,
      WAITING: 0,
      CLOSED: 0,
    };

    chatSessions.forEach((s) => {
      if (statusCounts[s.status] !== undefined) {
        statusCounts[s.status]++;
      }
    });

    const serializedChats = chatSessions.map((session) => ({
      id: session.id,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      closedAt: session.closedAt ? session.closedAt.toISOString() : null,
      guestName: session.guestName,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      user: session.user,
      assignedAgent: session.assignedAgent,
      order: session.order,
      messages: session.messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        senderId: m.senderId,
        senderType: m.senderType,
        senderName: m.senderName || m.sender?.name || (m.senderType === SenderType.AGENT ? "Support Agent" : "Customer"),
        content: m.content,
        isRead: m.isRead,
        attachments: m.attachments,
        createdAt: m.createdAt.toISOString(),
      })),
    }));

    return {
      success: true,
      data: {
        chats: serializedChats,
        stats: statusCounts,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch admin chats:", error);
    return { error: "Failed to load live chat conversations." };
  }
}

// --------------------------------------------------------------------------
// 2. SEND MESSAGE IN CHAT SESSION (Agent / Admin)
// --------------------------------------------------------------------------
export async function sendChatMessageAction(sessionId: string, content: string) {
  const authCheck = await ensureAdminOrStaff();
  if (!authCheck.authorized || !authCheck.user?.id) {
    return { error: authCheck.error || "Unauthorized." };
  }

  const cleanContent = content?.trim();
  if (!cleanContent) {
    return { error: "Message cannot be empty." };
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return { error: "Chat conversation not found." };
    }

    const [newMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: authCheck.user.id,
          senderType: SenderType.AGENT,
          senderName: authCheck.user.name || "Support Specialist",
          content: cleanContent,
          isRead: true,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          assignedAgentId: authCheck.user.id,
          status: session.status === ChatStatus.CLOSED ? ChatStatus.ACTIVE : session.status,
          updatedAt: new Date(),
        },
      }),
    ]);

    revalidatePath("/admin/chat");

    return {
      success: true,
      message: {
        id: newMessage.id,
        sessionId: newMessage.sessionId,
        senderId: newMessage.senderId,
        senderType: newMessage.senderType,
        senderName: newMessage.senderName,
        content: newMessage.content,
        isRead: newMessage.isRead,
        attachments: newMessage.attachments,
        createdAt: newMessage.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Failed to send chat message:", error);
    return { error: "Failed to dispatch chat reply." };
  }
}

// --------------------------------------------------------------------------
// 3. UPDATE CHAT STATUS
// --------------------------------------------------------------------------
export async function updateChatStatusAction(sessionId: string, newStatus: ChatStatus) {
  const authCheck = await ensureAdminOrStaff();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  try {
    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        closedAt: newStatus === ChatStatus.CLOSED ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/chat");

    return {
      success: true,
      status: updated.status,
      closedAt: updated.closedAt ? updated.closedAt.toISOString() : null,
    };
  } catch (error: any) {
    console.error("Failed to update chat status:", error);
    return { error: "Failed to update chat status." };
  }
}
