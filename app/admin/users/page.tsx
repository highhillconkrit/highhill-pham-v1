"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  member: boolean;
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", member: false });
  const [saved, setSaved] = useState(false);
  const today = new Date();
  const [exportYear, setExportYear] = useState(today.getFullYear());
  const [exportMonth, setExportMonth] = useState(today.getMonth());

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { setUnauthorized(true); return; }
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) loadUsers();
  }, [session]);

  const openEdit = (user: UserRecord) => {
    setEditing(user);
    setForm({ name: user.name ?? "", phone: user.phone ?? "", member: user.member });
    setSaved(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, ...form }),
    });
    if (res.ok) {
      setSaved(true);
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...form } : u));
    }
  };

  if (!session?.user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Users</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Sign in to manage users</p>
          <button onClick={() => signIn("google")} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Access Denied</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">You do not have admin access.</p>
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Calendar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Users</h1>
          <div className="flex gap-4">
            <Link href="/admin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Hours</Link>
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Calendar</Link>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                  <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                  <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Phone</th>
                  <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Member</th>
                  <th className="text-right pb-2 font-medium text-zinc-500 dark:text-zinc-400"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="py-2 text-zinc-900 dark:text-zinc-100">{u.email}</td>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">{u.name || "—"}</td>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">{u.phone || "—"}</td>
                    <td className="py-2">
                      {u.member ? (
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Yes</span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">No</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => openEdit(u)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-zinc-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Export Check-in Report</h2>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Month</label>
              <select
                value={exportMonth}
                onChange={e => setExportMonth(Number(e.target.value))}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{new Date(0, i).toLocaleString("en-US", { month: "long" })}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Year</label>
              <select
                value={exportYear}
                onChange={e => setExportYear(Number(e.target.value))}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => window.open(`/api/admin/export?year=${exportYear}&month=${exportMonth}`, "_blank")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeEdit}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Edit User</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{editing.email}</p>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Member</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, member: !f.member }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.member ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.member ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{form.member ? "Yes" : "No"}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={closeEdit} className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Save
                </button>
              </div>
              {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">Saved!</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
