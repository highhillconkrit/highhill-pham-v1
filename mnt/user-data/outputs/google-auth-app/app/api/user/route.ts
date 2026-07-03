import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/user — update the signed-in user's own profile fields.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const { name, bio } = body as { name?: string; bio?: string };

  // Only allow known, safe fields to be updated from the client.
  const data: { name?: string; bio?: string } = {};
  if (typeof name === "string") data.name = name.slice(0, 120);
  if (typeof bio === "string") data.bio = bio.slice(0, 500);

  const updated = await prisma.user.update({
    where: { id: (session.user as { id: string }).id },
    data,
  });

  return NextResponse.json({ user: updated });
}

// DELETE /api/user — permanently remove the signed-in user and their
// linked accounts/sessions (cascades via the Prisma schema relations).
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await prisma.user.delete({
    where: { id: (session.user as { id: string }).id },
  });

  return NextResponse.json({ ok: true });
}
