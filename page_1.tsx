import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <main className="welcome">
      <div className="card">
        <h1>Hello, {session.user.name ?? "there"} 👋</h1>
        <p className="email">{session.user.email}</p>
      </div>

      <style>{`
        .welcome {
          min-height: 100vh;
          background: var(--parchment);
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .card {
          background: #fff;
          border: 1px solid var(--parchment-dim);
          border-radius: 14px;
          padding: 3rem 2.5rem;
          text-align: center;
        }
        .card h1 {
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .email {
          color: #8a8880;
          font-size: 0.95rem;
        }
      `}</style>
    </main>
  );
}
