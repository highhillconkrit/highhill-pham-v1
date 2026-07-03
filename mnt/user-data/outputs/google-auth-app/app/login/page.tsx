import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginCard } from "./login-card";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="wrap">
      <section className="brand">
        <div className="mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="56" height="56">
            <circle cx="60" cy="60" r="58" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
            <circle cx="60" cy="16" r="5" fill="var(--gold)" />
            <circle cx="98" cy="80" r="5" fill="var(--teal)" />
            <circle cx="22" cy="80" r="5" fill="var(--parchment)" />
            <line x1="60" y1="16" x2="98" y2="80" stroke="var(--parchment-dim)" strokeWidth="1" opacity="0.4" />
            <line x1="98" y1="80" x2="22" y2="80" stroke="var(--parchment-dim)" strokeWidth="1" opacity="0.4" />
            <line x1="22" y1="80" x2="60" y2="16" stroke="var(--parchment-dim)" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>
        <h1>One account, <em>quietly</em> connected.</h1>
        <p>
          Sign in once with Google and every session, profile detail, and
          preference is kept in sync in your own database — nothing stored
          anywhere else.
        </p>
        <ul className="points">
          <li>No new password to create or lose</li>
          <li>Your data lives in your Prisma database</li>
          <li>Revoke access from your Google account anytime</li>
        </ul>
      </section>

      <section className="panel">
        <LoginCard />
      </section>

      <style>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
        }
        .brand {
          padding: 5rem 4.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.5rem;
          max-width: 640px;
        }
        .mark { margin-bottom: 0.5rem; }
        .brand h1 {
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 2.6rem;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .brand h1 em {
          font-style: italic;
          color: var(--gold);
        }
        .brand p {
          font-size: 1.05rem;
          line-height: 1.6;
          color: var(--parchment-dim);
          max-width: 46ch;
        }
        .points {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-top: 0.5rem;
          font-size: 0.92rem;
          color: var(--parchment-dim);
        }
        .points li {
          padding-left: 1.2rem;
          position: relative;
        }
        .points li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.55em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--teal);
        }
        .panel {
          background: var(--parchment);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        @media (max-width: 860px) {
          .wrap { grid-template-columns: 1fr; }
          .brand { padding: 3rem 1.75rem 1rem; }
          .brand h1 { font-size: 2rem; }
          .panel { padding: 2rem 1.5rem 3.5rem; }
        }
      `}</style>
    </main>
  );
}
