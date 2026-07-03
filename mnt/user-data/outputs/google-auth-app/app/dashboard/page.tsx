import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePanel } from "./profile-panel";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // This is the "manage user data" half: reading straight from Prisma
  // using the id NextAuth attached to the session.
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: (session.user as { id: string }).id },
  });

  return (
    <main className="dash">
      <ProfilePanel user={user} />
      <style>{`
        .dash {
          min-height: 100vh;
          background: var(--parchment);
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
      `}</style>
    </main>
  );
}
