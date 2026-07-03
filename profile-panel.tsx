"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@prisma/client";

export function ProfilePanel({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    setSaving(false);
    setStatus(res.ok ? "Saved." : "Couldn't save — try again.");
    router.refresh();
  }

  async function handleDelete() {
    const sure = window.confirm(
      "Delete your account and all stored data? This can't be undone."
    );
    if (!sure) return;
    await fetch("/api/user", { method: "DELETE" });
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="card">
      <header>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="avatar" />
        ) : (
          <div className="avatar placeholder">{(user.name ?? "?")[0]}</div>
        )}
        <div>
          <h1>{user.name ?? "Your account"}</h1>
          <p className="email">{user.email}</p>
        </div>
      </header>

      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      </label>

      <label className="field">
        <span>Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Say something about yourself…"
        />
      </label>

      <div className="actions">
        <button className="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button className="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign out
        </button>
      </div>
      {status && <p className="status">{status}</p>}

      <div className="danger">
        <div>
          <strong>Delete account</strong>
          <p>Removes your profile and every record tied to it from the database.</p>
        </div>
        <button className="danger-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>

      <style>{`
        .card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid var(--parchment-dim);
          border-radius: 14px;
          padding: 2.25rem;
        }
        header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--teal);
          color: #fff;
          font-family: var(--font-display);
          font-size: 1.4rem;
        }
        header h1 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 500;
        }
        .email {
          font-size: 0.85rem;
          color: #8a8880;
        }
        .field {
          display: block;
          margin-bottom: 1.1rem;
        }
        .field span {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: #6b6a63;
          margin-bottom: 0.35rem;
        }
        .field input,
        .field textarea {
          width: 100%;
          border: 1px solid #d8d5c9;
          border-radius: 8px;
          padding: 0.65rem 0.8rem;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--ink);
          resize: vertical;
        }
        .field input:focus,
        .field textarea:focus {
          outline: 2px solid var(--teal);
          outline-offset: 1px;
        }
        .actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .primary {
          padding: 0.65rem 1.2rem;
          border-radius: 8px;
          border: none;
          background: var(--ink);
          color: var(--parchment);
          font-weight: 500;
          cursor: pointer;
        }
        .primary:disabled { opacity: 0.6; cursor: default; }
        .ghost {
          padding: 0.65rem 1.2rem;
          border-radius: 8px;
          border: 1px solid #d8d5c9;
          background: transparent;
          color: var(--ink);
          cursor: pointer;
        }
        .status {
          margin-top: 0.75rem;
          font-size: 0.85rem;
          color: var(--teal);
        }
        .danger {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--parchment-dim);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .danger strong { font-size: 0.9rem; }
        .danger p {
          font-size: 0.78rem;
          color: #9a9890;
          margin-top: 0.15rem;
          max-width: 30ch;
        }
        .danger-btn {
          flex-shrink: 0;
          padding: 0.55rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--error);
          background: transparent;
          color: var(--error);
          cursor: pointer;
          font-size: 0.85rem;
        }
        .danger-btn:hover { background: var(--error); color: #fff; }
      `}</style>
    </div>
  );
}
