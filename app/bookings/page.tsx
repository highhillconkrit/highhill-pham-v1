"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type BookingRecord = {
  id: string;
  date: string;
  slot: string;
  name: string | null;
  email: string;
  phone: string | null;
};

function groupByUserPerMonth(bookings: BookingRecord[]) {
  const groups: Record<string, { name: string | null; email: string; phone: string | null; months: Record<string, BookingRecord[]> }> = {};
  for (const b of bookings) {
    if (!groups[b.email]) {
      groups[b.email] = { name: b.name, email: b.email, phone: b.phone, months: {} };
    }
    const d = new Date(b.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[b.email].months[key]) groups[b.email].months[key] = [];
    groups[b.email].months[key].push(b);
  }
  return groups;
}

export default function BookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    fetch("/api/bookings").then(r => r.ok && r.json()).then(setBookings);
  }, []);

  if (!session?.user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Bookings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Sign in to view bookings</p>
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

  const grouped = groupByUserPerMonth(bookings);
  const users = Object.values(grouped).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Bookings</h1>
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Calendar view
          </Link>
        </div>

        {users.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {users.map(u => {
              const monthKeys = Object.keys(u.months).sort();
              const total = monthKeys.reduce((s, k) => s + u.months[k].length, 0);
              return (
                <div key={u.email} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{u.email} &middot; {u.phone} &middot; {total} booking{total !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="space-y-4">
                    {monthKeys.map(mk => {
                      const [y, m] = mk.split("-").map(Number);
                      const label = new Date(y, m - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                      const monthBookings = u.months[mk];
                      return (
                        <div key={mk}>
                          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{label} &middot; {monthBookings.length} booking{monthBookings.length !== 1 ? "s" : ""}</h3>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                                <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Slot</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthBookings.map(b => {
                                const d = new Date(b.date);
                                const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                                return (
                                  <tr key={b.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                    <td className="py-2 text-zinc-900 dark:text-zinc-100">{dateStr}</td>
                                    <td className="py-2 capitalize text-zinc-600 dark:text-zinc-400">{b.slot === "default" ? "Full day" : b.slot}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
