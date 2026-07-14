"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type HoursEntry = {
  id: string;
  dayType: string;
  slot: string;
  openTime: string;
  closeTime: string;
  enabled: boolean;
};

type SlotConfig = {
  openTime: string;
  closeTime: string;
  enabled: boolean;
};

function TimeRow({
  label,
  config,
  onChange,
}: {
  label: string;
  config: SlotConfig;
  onChange: (c: SlotConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{config.enabled ? "Open" : "Closed"}</span>
        </label>
      </div>
      {config.enabled && (
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Open</label>
            <input
              type="time"
              value={config.openTime}
              onChange={(e) => onChange({ ...config, openTime: e.target.value })}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 mt-5">—</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Close</label>
            <input
              type="time"
              value={config.closeTime}
              onChange={(e) => onChange({ ...config, closeTime: e.target.value })}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [weekday, setWeekday] = useState<SlotConfig>({ openTime: "09:00", closeTime: "17:00", enabled: true });
  const [weekendMorning, setWeekendMorning] = useState<SlotConfig>({ openTime: "09:00", closeTime: "12:00", enabled: true });
  const [weekendEvening, setWeekendEvening] = useState<SlotConfig>({ openTime: "13:00", closeTime: "17:00", enabled: true });
  const [saved, setSaved] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const today = new Date();
  const [exportYear, setExportYear] = useState(today.getFullYear());
  const [exportMonth, setExportMonth] = useState(today.getMonth());

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/admin/hours")
      .then((r) => {
        if (r.status === 403) {
          setUnauthorized(true);
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then((data: HoursEntry[] | null) => {
        if (!data) return;
        for (const entry of data) {
          const config: SlotConfig = {
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            enabled: entry.enabled,
          };
          if (entry.dayType === "weekday" && entry.slot === "default") setWeekday(config);
          if (entry.dayType === "weekend" && entry.slot === "morning") setWeekendMorning(config);
          if (entry.dayType === "weekend" && entry.slot === "evening") setWeekendEvening(config);
        }
      });
  }, [session]);

  if (!session?.user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Sign in to access admin settings</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    const res = await fetch("/api/admin/hours", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekday, weekendMorning, weekendEvening }),
    });

    if (res.ok) setSaved(true);
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Operating Hours</h1>
          <div className="flex gap-4">
            <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Users</Link>
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Calendar</Link>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4">
          <TimeRow
            label="Weekdays (Mon – Fri)"
            config={weekday}
            onChange={setWeekday}
          />
          <TimeRow
            label="Weekend Morning (Sat – Sun)"
            config={weekendMorning}
            onChange={setWeekendMorning}
          />
          <TimeRow
            label="Weekend Evening (Sat – Sun)"
            config={weekendEvening}
            onChange={setWeekendEvening}
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          {saved && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">Saved!</p>
          )}
        </form>

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
    </div>
  );
}
