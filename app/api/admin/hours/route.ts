import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/admin";

type SlotConfig = { openTime: string; closeTime: string; enabled: boolean };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const hours = await prisma.operatingHours.findMany({
      orderBy: [{ dayType: "asc" }, { slot: "asc" }],
    });
    return NextResponse.json(hours);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { weekday, weekendMorning, weekendEvening } = body as {
    weekday?: SlotConfig;
    weekendMorning?: SlotConfig;
    weekendEvening?: SlotConfig;
  };

  const upserts: Promise<unknown>[] = [];

  if (weekday) {
    upserts.push(
      prisma.operatingHours.upsert({
        where: { dayType_slot: { dayType: "weekday", slot: "default" } },
        create: { dayType: "weekday", slot: "default", ...weekday },
        update: { openTime: weekday.openTime, closeTime: weekday.closeTime, enabled: weekday.enabled },
      })
    );
  }

  if (weekendMorning) {
    upserts.push(
      prisma.operatingHours.upsert({
        where: { dayType_slot: { dayType: "weekend", slot: "morning" } },
        create: { dayType: "weekend", slot: "morning", ...weekendMorning },
        update: { openTime: weekendMorning.openTime, closeTime: weekendMorning.closeTime, enabled: weekendMorning.enabled },
      })
    );
  }

  if (weekendEvening) {
    upserts.push(
      prisma.operatingHours.upsert({
        where: { dayType_slot: { dayType: "weekend", slot: "evening" } },
        create: { dayType: "weekend", slot: "evening", ...weekendEvening },
        update: { openTime: weekendEvening.openTime, closeTime: weekendEvening.closeTime, enabled: weekendEvening.enabled },
      })
    );
  }

  await Promise.all(upserts);

  return NextResponse.json({ success: true });
}
