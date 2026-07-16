import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const days = await prisma.urgentDay.findMany({ orderBy: { date: "asc" } });
    return NextResponse.json(days);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { date, slot, note } = body as { date?: string; slot?: string; note?: string };

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const urgentSlot = slot ?? "default";

  const existing = await prisma.urgentDay.findFirst({
    where: { date: { gte: start, lte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) }, slot: urgentSlot },
  });

  if (existing) {
    await prisma.urgentDay.delete({ where: { id: existing.id } });
    return NextResponse.json({ urgent: false });
  }

  await prisma.urgentDay.create({ data: { date: start, slot: urgentSlot, note: note ?? null } });
  return NextResponse.json({ urgent: true });
}
