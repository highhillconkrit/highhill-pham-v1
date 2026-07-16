import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getOperatingHours, getHoursForSlot, isWithinOperatingHours } from "@/app/lib/admin";
import { toDateKey, yearMonthRange } from "@/app/lib/dateUtils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "");
  const month = parseInt(searchParams.get("month") ?? "");

  let where = {};
  if (!isNaN(year) && !isNaN(month)) {
    const range = yearMonthRange(year, month);
    where = { date: { gte: range.start, lte: range.end } };
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

  let hours: Awaited<ReturnType<typeof getOperatingHours>> = [];
  try {
    hours = await getOperatingHours();
  } catch {
    // OperatingHours table may not exist yet
  }

  let urgentDays: { date: string; slot: string }[] = [];
  try {
    const rows = await prisma.urgentDay.findMany();
    urgentDays = rows.map(u => ({ date: toDateKey(u.date), slot: u.slot }));
  } catch {
    // UrgentDay table may not exist yet
  }

  return NextResponse.json({ bookings: enriched, operatingHours: hours, urgentDays });
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

  const date = new Date(Date.UTC(year, month, day));
  const bookingSlot = slot ?? "default";

  const dayOfWeek = date.getDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekendDay ? "weekend" : "weekday";

  try {
    const hours = await prisma.operatingHours.findUnique({
      where: { dayType_slot: { dayType, slot: bookingSlot } },
    });
    if (hours && !hours.enabled) {
      return NextResponse.json({ error: "This time slot is currently closed for bookings" }, { status: 403 });
    }
  } catch {
    // OperatingHours table may not exist yet — allow booking
  }

  const existing = await prisma.booking.findUnique({
    where: { date_email_slot: { date, email, slot: bookingSlot } },
  });

  if (existing) {
    return NextResponse.json({ error: "A booking with this email already exists on this date for this slot" }, { status: 409 });
  }

  const monthRange = yearMonthRange(year, month);
  const monthCount = await prisma.booking.count({
    where: { email, date: { gte: monthRange.start, lte: monthRange.end } },
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

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, action } = body as { id?: string; action?: string };

  if (!id || !action) {
    return NextResponse.json({ error: "id and action are required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const bookingDate = new Date(booking.date);
  const dayOfWeek = bookingDate.getUTCDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekendDay ? "weekend" : "weekday";

  const isSameDay =
    now.getUTCFullYear() === bookingDate.getUTCFullYear() &&
    now.getUTCMonth() === bookingDate.getUTCMonth() &&
    now.getUTCDate() === bookingDate.getUTCDate();

  if (!isSameDay) {
    return NextResponse.json({ error: "You can only check in on the booking day" }, { status: 403 });
  }

  let hoursEnabled = true;
  try {
    const hours = await getHoursForSlot(dayType, booking.slot);
    if (hours) {
      hoursEnabled = hours.enabled;
      if (!isWithinOperatingHours(hours, now.getHours(), now.getMinutes())) {
        return NextResponse.json({ error: "Outside operating hours for this time slot" }, { status: 403 });
      }
    }
  } catch {
    // OperatingHours table may not exist yet — allow action
  }

  if (!hoursEnabled) {
    return NextResponse.json({ error: "This time slot is currently closed" }, { status: 403 });
  }

  if (action === "checkin") {
    if (booking.checkedInAt) {
      return NextResponse.json({ error: "Already checked in" }, { status: 409 });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { checkedInAt: now },
    });
    return NextResponse.json(updated);
  }

  if (action === "checkout") {
    if (!booking.checkedInAt) {
      return NextResponse.json({ error: "Not checked in yet" }, { status: 409 });
    }
    if (booking.checkedOutAt) {
      return NextResponse.json({ error: "Already checked out" }, { status: 409 });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { checkedOutAt: now },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
