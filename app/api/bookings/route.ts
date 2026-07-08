import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "");
  const month = parseInt(searchParams.get("month") ?? "");

  let where = {};
  if (!isNaN(year) && !isNaN(month)) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    where = { date: { gte: start, lte: end } };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const emails = [...new Set(bookings.map(b => b.email))];
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true, name: true, phone: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.email, u]));

  const enriched = bookings.map(b => ({
    ...b,
    name: userMap[b.email]?.name ?? null,
    phone: userMap[b.email]?.phone ?? null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { year, month, day, email, slot } = body;

  if (year === undefined || month === undefined || !day || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const date = new Date(year, month, day);
  const bookingSlot = slot ?? "default";

  const existing = await prisma.booking.findUnique({
    where: { date_email_slot: { date, email, slot: bookingSlot } },
  });

  if (existing) {
    return NextResponse.json({ error: "A booking with this email already exists on this date for this slot" }, { status: 409 });
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthCount = await prisma.booking.count({
    where: { email, date: { gte: monthStart, lte: monthEnd } },
  });

  if (monthCount >= 7) {
    return NextResponse.json({ error: "Maximum of 7 bookings per month reached" }, { status: 429 });
  }

  const booking = await prisma.booking.create({
    data: { date, email, slot: bookingSlot, name: user.name, phone: user.phone },
  });

  return NextResponse.json(booking, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
