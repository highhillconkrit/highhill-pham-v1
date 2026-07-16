import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/admin";
import { dateKeyRange } from "@/app/lib/dateUtils";

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

  const urgentSlot = slot ?? "default";

  const range = dateKeyRange(date);

  const existing = await prisma.urgentDay.findFirst({
    where: { date: { gte: range.start, lte: range.end }, slot: urgentSlot },
  });

  if (existing) {
    await prisma.urgentDay.delete({ where: { id: existing.id } });
    return NextResponse.json({ urgent: false });
  }

  await prisma.urgentDay.create({ data: { date: range.start, slot: urgentSlot, note: note ?? null } });
  return NextResponse.json({ urgent: true });
}
