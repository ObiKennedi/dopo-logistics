"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in to update your profile." };
  }

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name) {
    return { error: "Name is required." };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/admin/profile");

    return {
      success: "Profile updated successfully!",
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in to change your password." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    // If user already has a password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return { error: "Current password is required." };
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return { error: "Incorrect current password." };
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    revalidatePath("/profile");
    revalidatePath("/admin/profile");

    return { success: "Password updated successfully!" };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return { error: "Failed to change password. Please try again." };
  }
}
