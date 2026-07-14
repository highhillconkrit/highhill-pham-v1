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
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

function isWeekend(year: number, month: number, day: number) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

function getAllDates(minDate: Date, maxDate: Date) {
  const dates: { year: number; month: number; day: number }[] = [];
  const d = new Date(minDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(maxDate);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    dates.push({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function bookingsByDate(bookings: BookingRecord[]) {
  const map: Record<string, BookingRecord[]> = {};
  for (const b of bookings) {
    const d = new Date(b.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map[key]) map[key] = [];
    map[key].push(b);
  }
  return map;
}

export default function BookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("default");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [form, setForm] = useState({ email: "" });

  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth() - 1, 25);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  useEffect(() => {
    fetch("/api/bookings").then(r => r.ok && r.json()).then(data => {
      setBookings(data.bookings);
    });
  }, []);

  const loadBookings = async () => {
    const res = await fetch("/api/bookings");
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings);
    }
  };

  const byDate = bookingsByDate(bookings);
  const allDates = getAllDates(minDate, maxDate);

  const openBooking = (y: number, m: number, d: number, booking: BookingRecord | null) => {
    setSelectedDate({ year: y, month: m, day: d });
    setSelectedSlot(isWeekend(y, m, d) ? "morning" : "default");
    setSelectedBooking(booking);
    setForm({ email: session?.user?.email ?? "" });
  };

  const closeBooking = () => {
    setSelectedDate(null);
    setSelectedBooking(null);
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/bookings?id=${selectedBooking.id}`, { method: "DELETE" });
    closeBooking();
    loadBookings();
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedBooking.id, action: "checkin" }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Check-in failed");
      return;
    }
    const updated = await res.json();
    setSelectedBooking(updated);
    loadBookings();
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return;
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedBooking.id, action: "checkout" }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Check-out failed");
      return;
    }
    const updated = await res.json();
    setSelectedBooking(updated);
    loadBookings();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: selectedDate.year,
        month: selectedDate.month,
        day: selectedDate.day,
        slot: selectedSlot,
        ...form,
      }),
    });

    if (res.status === 409) {
      alert("A booking with this email already exists on this date for this slot.");
      return;
    }
    if (res.status === 429) {
      alert("Maximum of 7 bookings per month reached.");
      return;
    }
    if (res.status === 403) {
      const data = await res.json();
      alert(data.error || "This day is closed for bookings.");
      return;
    }
    if (!res.ok) {
      alert("Failed to save booking.");
      return;
    }

    closeBooking();
    loadBookings();
  };

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

  const byMonth: Record<string, { year: number; month: number; day: number }[]> = {};
  for (const d of allDates) {
    const key = `${d.year}-${String(d.month + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(d);
  }
  const monthKeys = Object.keys(byMonth).sort();

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Bookings</h1>
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Calendar view
          </Link>
        </div>

        <div className="space-y-6">
          {monthKeys.map(mk => {
            const [y, m] = mk.split("-").map(Number);
            const label = new Date(y, m - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
            const days = byMonth[mk];
            const monthBookingCount = days.filter(d => {
              const key = `${d.year}-${d.month}-${d.day}`;
              return byDate[key] !== undefined;
            }).length;

            return (
              <div key={mk} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{label} &middot; {monthBookingCount} booking{monthBookingCount !== 1 ? "s" : ""}</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                      <th className="text-left pb-2 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(d => {
                      const key = `${d.year}-${d.month}-${d.day}`;
                      const dayBookings = byDate[key] ?? [];
                      const weekend = isWeekend(d.year, d.month, d.day);
                      const isToday = d.year === today.getFullYear() && d.month === today.getMonth() && d.day === today.getDate();

                      if (weekend) {
                        const morningBooking = dayBookings.find(b => b.slot === "morning") ?? null;
                        const eveningBooking = dayBookings.find(b => b.slot === "evening") ?? null;

                        const morningOwn = morningBooking?.email === session.user.email;
                        const eveningOwn = eveningBooking?.email === session.user.email;

                        return (
                          <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                            <td className={`py-2 text-zinc-900 dark:text-zinc-100 ${isToday ? "font-bold text-blue-600" : ""}`}>
                              {new Date(d.year, d.month, d.day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </td>
                            <td className="py-2">
                              <div className="flex gap-2">
                                {morningBooking ? (
                                  <button onClick={() => openBooking(d.year, d.month, d.day, morningBooking)} className={`rounded px-2 py-1 text-xs font-medium ${morningOwn ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"}`}>
                                    AM &middot; {morningBooking.name}{morningBooking.checkedInAt ? " \u2713" : ""}
                                  </button>
                                ) : (
                                  <button onClick={() => openBooking(d.year, d.month, d.day, null)} className="rounded px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    AM &middot; Free
                                  </button>
                                )}
                                {eveningBooking ? (
                                  <button onClick={() => openBooking(d.year, d.month, d.day, eveningBooking)} className={`rounded px-2 py-1 text-xs font-medium ${eveningOwn ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"}`}>
                                    PM &middot; {eveningBooking.name}{eveningBooking.checkedInAt ? " \u2713" : ""}
                                  </button>
                                ) : (
                                  <button onClick={() => openBooking(d.year, d.month, d.day, null)} className="rounded px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    PM &middot; Free
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const defaultBooking = dayBookings.find(b => b.slot === "default") ?? null;
                      const defaultOwn = defaultBooking?.email === session.user.email;

                      return (
                        <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                          <td className={`py-2 text-zinc-900 dark:text-zinc-100 ${isToday ? "font-bold text-blue-600" : ""}`}>
                            {new Date(d.year, d.month, d.day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </td>
                          <td className="py-2">
                            {defaultBooking ? (
                              <button onClick={() => openBooking(d.year, d.month, d.day, defaultBooking)} className={`rounded px-2 py-1 text-xs font-medium ${defaultOwn ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"}`}>
                                Booked &middot; {defaultBooking.name}{defaultBooking.checkedInAt ? " \u2713" : ""}
                              </button>
                            ) : (
                              <button onClick={() => openBooking(d.year, d.month, d.day, null)} className="rounded px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Free
                              </button>
                            )}
                          </td>
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

      {selectedDate !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeBooking}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              {new Date(selectedDate.year, selectedDate.month, selectedDate.day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>

            {selectedBooking ? (
              <div className="mt-4 space-y-3">
                {selectedBooking.slot !== "default" && (
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Slot</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{selectedBooking.slot}</p>
                  </div>
                )}
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Name</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedBooking.name}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedBooking.email}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedBooking.phone}</p>
                </div>
                {selectedBooking.checkedInAt && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Checked in</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(selectedBooking.checkedInAt).toLocaleTimeString()}</p>
                  </div>
                )}
                {selectedBooking.checkedOutAt && (
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Checked out</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(selectedBooking.checkedOutAt).toLocaleTimeString()}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={closeBooking}
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Close
                  </button>
                  {session?.user?.email === selectedBooking.email && !selectedBooking.checkedInAt && (
                    <button
                      onClick={handleCheckIn}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                      Check In
                    </button>
                  )}
                  {session?.user?.email === selectedBooking.email && selectedBooking.checkedInAt && !selectedBooking.checkedOutAt && (
                    <button
                      onClick={handleCheckOut}
                      className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                    >
                      Check Out
                    </button>
                  )}
                  {session?.user?.email === selectedBooking.email && !selectedBooking.checkedInAt && (
                    <button
                      onClick={handleDelete}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                {isWeekend(selectedDate.year, selectedDate.month, selectedDate.day) && (
                  <div className="flex gap-2">
                    {["morning", "evening"].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                          selectedSlot === s
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={closeBooking}
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
