"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { ServiceType, OrderStatus } from "@prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/resend";

function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DP-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapServiceType(service: string): string {
  // Map incoming service string to the corresponding Prisma ServiceType enum value.
  // We return the literal enum name as a string; Prisma accepts string literals matching the enum.
  switch (service) {
    case "Delivery Services":
    case "DELIVERY_SERVICES":
      return "DELIVERY_SERVICES";
    case "Errand Running":
    case "ERRAND_RUNNING":
      return "ERRAND_RUNNING";
    case "Shopping Assistance":
    case "SHOPPING_ASSISTANCE":
      return "SHOPPING_ASSISTANCE";
    case "Procurement":
    case "PROCUREMENT":
      return "PROCUREMENT";
    case "Price Check & Market Survey":
    case "Price Check":
    case "PRICE_CHECK":
      return "PRICE_CHECK";
    case "Hotel Search & Reservation":
    case "Hotel Reservation":
    case "HOTEL_RESERVATION":
      return "HOTEL_RESERVATION";
    default:
      return "DELIVERY_SERVICES";
  }
}

async function sendTelegramNotification(
  trackingNumber: string,
  service: string,
  data: {
    fullName: string;
    email: string;
    phone?: string;
    pickupLocation?: string;
    deliveryLocation?: string;
    itemDetails?: string;
    budget?: string;
    hotelCity?: string;
    checkInDate?: string;
    checkOutDate?: string;
    additionalNotes?: string;
  }
) {
  const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";

  if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN.includes("your_") || CHAT_ID.includes("YOUR_")) {
    return;
  }

  let msg = `🚨 *New Order Created in System!*\n\n`;
  msg += `🏷 *Tracking Code:* \`${trackingNumber}\`\n`;
  msg += `👤 *Customer:* ${data.fullName}\n`;
  msg += `✉️ *Email:* ${data.email}\n`;
  msg += `📞 *Phone:* ${data.phone || "N/A"}\n`;
  msg += `🛠 *Service:* ${service}\n\n`;

  if (data.pickupLocation || data.deliveryLocation) {
    msg += `📍 *Pickup:* ${data.pickupLocation || "N/A"}\n`;
    msg += `🏁 *Destination:* ${data.deliveryLocation || "N/A"}\n`;
  }

  if (data.itemDetails) {
    msg += `📦 *Details:* ${data.itemDetails}\n`;
  }

  if (data.budget) {
    msg += `💰 *Budget:* ${data.budget}\n`;
  }

  if (data.hotelCity) {
    msg += `🏨 *City:* ${data.hotelCity}\n`;
    msg += `📅 *Dates:* ${data.checkInDate || "N/A"} to ${data.checkOutDate || "N/A"}\n`;
  }

  if (data.additionalNotes) {
    msg += `\n📝 *Notes:* ${data.additionalNotes}`;
  }

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
    console.warn("Telegram notification failed:", err);
  }
}

export async function createOrderAction(prevState: any, formData: FormData) {
  const session = await auth();

  const serviceRaw = (formData.get("service") as string) || "Delivery Services";
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const pickupLocation = (formData.get("pickupLocation") as string)?.trim();
  const deliveryLocation = (formData.get("deliveryLocation") as string)?.trim();
  const itemDetails = (formData.get("itemDetails") as string)?.trim();
  const budget = (formData.get("budget") as string)?.trim();
  const hotelCity = (formData.get("hotelCity") as string)?.trim();
  const checkInDateStr = formData.get("checkInDate") as string;
  const checkOutDateStr = formData.get("checkOutDate") as string;
  const additionalNotes = (formData.get("additionalNotes") as string)?.trim();

  if (!fullName || !email) {
    return { error: "Full Name and Email Address are required." };
  }

  const serviceType = mapServiceType(serviceRaw) as ServiceType;
  const trackingNumber = generateTrackingCode();

  const checkInDate = checkInDateStr && !isNaN(new Date(checkInDateStr).getTime()) ? new Date(checkInDateStr) : null;
  const checkOutDate = checkOutDateStr && !isNaN(new Date(checkOutDateStr).getTime()) ? new Date(checkOutDateStr) : null;

  try {
    const order = await prisma.order.create({
      data: {
        trackingNumber,
        serviceType,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone || null,
        userId: session?.user?.id || null,
        pickupLocation: pickupLocation || null,
        deliveryLocation: deliveryLocation || null,
        itemDetails: itemDetails || null,
        budget: budget || null,
        hotelCity: hotelCity || null,
        checkInDate,
        checkOutDate,
        additionalNotes: additionalNotes || null,
      },
    });

    if (session?.user?.id) {
      revalidatePath("/dashboard");
      revalidatePath("/user-track");
    }

    // Send async alerts
    sendTelegramNotification(trackingNumber, serviceRaw, {
      fullName,
      email,
      phone,
      pickupLocation,
      deliveryLocation,
      itemDetails,
      budget,
      hotelCity,
      checkInDate: checkInDateStr,
      checkOutDate: checkOutDateStr,
      additionalNotes,
    }).catch(console.error);

    sendOrderConfirmationEmail(email, trackingNumber, serviceRaw, fullName).catch(console.error);

    return {
      success: true,
      trackingNumber: order.trackingNumber,
      serviceName: serviceRaw,
      customerName: fullName,
      customerEmail: email,
    };
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return { error: "Unable to create your order request. Please try again." };
  }
}

export async function trackOrderAction(trackingCode: string) {
  if (!trackingCode || !trackingCode.trim()) {
    return { error: "Please enter a tracking number." };
  }

  const cleanCode = trackingCode.trim().toUpperCase();

  try {
    const order = await prisma.order.findUnique({
      where: { trackingNumber: cleanCode },
    });

    if (!order) {
      return {
        error: `No order found for tracking number "${cleanCode}". Please verify your code and try again.`,
      };
    }

    return {
      success: true,
      order: {
        id: order.id,
        trackingNumber: order.trackingNumber,
        serviceType: order.serviceType,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        pickupLocation: order.pickupLocation,
        deliveryLocation: order.deliveryLocation,
        itemDetails: order.itemDetails,
        budget: order.budget,
        hotelCity: order.hotelCity,
        checkInDate: order.checkInDate ? order.checkInDate.toISOString() : null,
        checkOutDate: order.checkOutDate ? order.checkOutDate.toISOString() : null,
        additionalNotes: order.additionalNotes,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error looking up order:", error);
    return { error: "Failed to fetch order information. Please try again later." };
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus) {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return { error: "Unauthorized. Admin privileges required to update order status." };
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    return {
      success: true,
      newStatus: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { error: "Failed to update order status." };
  }
}
