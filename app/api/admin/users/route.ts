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

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, name: true, email: true, phone: true, member: true },
  });

  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, phone, member } = body as {
    id?: string;
    name?: string;
    phone?: string;
    member?: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const data: Record<string, string | boolean> = {};
  if (typeof name === "string") data.name = name;
  if (typeof phone === "string") data.phone = phone;
  if (typeof member === "boolean") data.member = member;

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data });

  return NextResponse.json({ success: true });
}
