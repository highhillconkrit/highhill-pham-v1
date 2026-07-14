const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

import { prisma } from "./prisma";

export type OperatingHoursRecord = {
  id: string;
  dayType: string;
  slot: string;
  openTime: string;
  closeTime: string;
  enabled: boolean;
};

export async function getOperatingHours(): Promise<OperatingHoursRecord[]> {
  return prisma.operatingHours.findMany({ orderBy: [{ dayType: "asc" }, { slot: "asc" }] });
}

export async function getHoursForSlot(
  dayType: string,
  slot: string
): Promise<OperatingHoursRecord | null> {
  return prisma.operatingHours.findUnique({ where: { dayType_slot: { dayType, slot } } });
}

export function isWithinOperatingHours(
  hours: OperatingHoursRecord | null,
  hour: number,
  minute: number
): boolean {
  if (!hours || !hours.enabled) return true;

  const [openH, openM] = hours.openTime.split(":").map(Number);
  const [closeH, closeM] = hours.closeTime.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const currentMinutes = hour * 60 + minute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
