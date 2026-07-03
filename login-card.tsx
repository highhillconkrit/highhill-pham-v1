"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginCard() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="card">
      <h2>Welcome back</h2>
      <p>Sign in to continue to your account.</p>

      <button
        className="google-btn"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          signIn("google", { callbackUrl: "/dashboard" });
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
          />
        </svg>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>

      <p className="fine">
        By continuing, you agree that your name, email, and profile image will
        be stored in this app's database.
      </p>

      <style>{`
        .card {
          width: 100%;
          max-width: 380px;
          background: #fff;
          border: 1px solid var(--parchment-dim);
          border-radius: 14px;
          padding: 2.5rem 2.25rem;
          box-shadow: 0 20px 50px -20px rgba(20, 22, 28, 0.25);
        }
        .card h2 {
          font-family: var(--font-display);
          font-size: 1.6rem;
          color: var(--ink);
          margin-bottom: 0.35rem;
        }
        .card > p {
          color: #6b6a63;
          font-size: 0.92rem;
          margin-bottom: 1.75rem;
        }
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          border: 1px solid #d8d5c9;
          background: #fff;
          color: var(--ink);
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .google-btn:hover:not(:disabled) {
          border-color: var(--teal);
          background: #fafaf7;
        }
        .google-btn:focus-visible {
          outline: 2px solid var(--teal);
          outline-offset: 2px;
        }
        .google-btn:disabled {
          opacity: 0.65;
          cursor: default;
        }
        .fine {
          margin-top: 1.5rem;
          font-size: 0.78rem;
          line-height: 1.5;
          color: #9a9890;
        }
      `}</style>
    </div>
  );
}
