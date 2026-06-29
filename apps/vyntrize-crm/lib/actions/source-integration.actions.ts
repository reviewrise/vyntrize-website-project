"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSourceIntegration(data: { provider: string; apiKey?: string; config?: any }) {
  try {
    const result = await prisma.sourceIntegration.create({
      data: {
        provider: data.provider,
        apiKey: data.apiKey,
        config: data.config ? data.config : null, // Prisma Json handles objects directly in modern versions, but if stringified it works too. Let's pass it as is.
        isActive: true,
      },
    });
    revalidatePath("/admin/sources");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create source integration:", error);
    return { success: false, error: "Failed to create source integration" };
  }
}

export async function updateSourceIntegration(id: string, data: { isActive?: boolean; apiKey?: string; config?: any }) {
  try {
    const result = await prisma.sourceIntegration.update({
      where: { id },
      data: {
        isActive: data.isActive,
        apiKey: data.apiKey,
        config: data.config ? data.config : undefined,
      },
    });
    revalidatePath("/admin/sources");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update source integration:", error);
    return { success: false, error: "Failed to update source integration" };
  }
}

export async function deleteSourceIntegration(id: string) {
  try {
    const result = await prisma.sourceIntegration.delete({
      where: { id },
    });
    revalidatePath("/admin/sources");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to delete source integration:", error);
    return { success: false, error: "Failed to delete source integration" };
  }
}

export async function getSourceIntegrations() {
  try {
    const integrations = await prisma.sourceIntegration.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: integrations };
  } catch (error) {
    console.error("Failed to fetch source integrations:", error);
    return { success: false, error: "Failed to fetch source integrations" };
  }
}
