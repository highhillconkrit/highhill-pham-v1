import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/admin";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (year && month) {
    const y = parseInt(year);
    const m = parseInt(month);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const emails = [...new Set(bookings.map((b) => b.email))];
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true, name: true, phone: true, member: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.email, u]));

  const urgentDates = await prisma.urgentDay.findMany();
  const urgentSet = new Set(urgentDates.map((u) => {
    const d = u.date;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return `${dateStr}_${u.slot}`;
  }));

  const header = "Date,Slot,Name,Email,Phone,Member,Urgent,Checked In,Checked Out";
  const rows = bookings.map((b) => {
    const d = new Date(b.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const u = userMap[b.email];
    const name = (u?.name ?? b.name ?? "").replace(/"/g, '""');
    const email = b.email;
    const phone = (u?.phone ?? b.phone ?? "").replace(/"/g, '""');
    const member = u?.member ? "Yes" : "No";
    const urgent = urgentSet.has(`${dateStr}_${b.slot}`) ? "Yes" : "No";
    const checkedIn = b.checkedInAt ? new Date(b.checkedInAt).toLocaleString() : "";
    const checkedOut = b.checkedOutAt ? new Date(b.checkedOutAt).toLocaleString() : "";
    return `${dateStr},"${b.slot}","${name}","${email}","${phone}",${member},${urgent},"${checkedIn}","${checkedOut}"`;
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="checkin-report${year && month ? `-${year}-${month}` : ""}.csv"`,
    },
  });
}
