"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { buildGoogleCalendarUrl } from "@/app/lib/gcal";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

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

type OperatingHours = {
  id: string;
  dayType: string;
  slot: string;
  openTime: string;
  closeTime: string;
  enabled: boolean;
};

function isWeekend(year: number, month: number, day: number) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

function MonthGrid({
  year,
  month,
  minDate,
  maxDate,
  bookingsByDay,
  onSlotClick,
  userEmail,
  operatingHours,
  urgentDays,
}: {
  year: number;
  month: number;
  minDate: Date;
  maxDate: Date;
  bookingsByDay: Record<number, BookingRecord[]>;
  onSlotClick: (year: number, month: number, day: number, slot: string, booking: BookingRecord | null) => void;
  userEmail: string | null | undefined;
  operatingHours: OperatingHours[];
  urgentDays: Set<string>;
}) {
  const days = getMonthDays(year, month);

  const isToday = (d: number) => {
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const canBook = (d: number) => {
    const date = new Date(year, month, d);
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    return date >= min && date <= max;
  };

  const isSlotClosed = (dayType: string, slot: string) => {
    const hours = operatingHours.find(h => h.dayType === dayType && h.slot === slot);
    return hours !== undefined && !hours.enabled;
  };

  const availableDays = days.filter((d): d is number => {
    if (d === null) return false;
    if (!canBook(d)) return false;
    const weekend = isWeekend(year, month, d);
    if (weekend) {
      const amClosed = isSlotClosed("weekend", "morning");
      const pmClosed = isSlotClosed("weekend", "evening");
      if (amClosed && pmClosed) return false;
      const dayBookings = bookingsByDay[d] ?? [];
      const amBooked = !amClosed && dayBookings.some(b => b.slot === "morning");
      const pmBooked = !pmClosed && dayBookings.some(b => b.slot === "evening");
      return !amBooked || !pmBooked;
    }
    const allClosed = isSlotClosed("weekday", "default");
    if (allClosed) return false;
    const dayBookings = bookingsByDay[d] ?? [];
    return !dayBookings.some(b => b.slot === "default");
  });

  const renderDay = (d: number, key: number) => {
    const dayBookings = bookingsByDay[d] ?? [];
    const weekend = isWeekend(year, month, d);
    const todayMatch = isToday(d);
    const bookable = canBook(d);
    const weekendClosed = isSlotClosed("weekend", "morning") && isSlotClosed("weekend", "evening");
    const weekdayClosed = isSlotClosed("weekday", "default");
    const allSlotsClosed = weekend ? weekendClosed : weekdayClosed;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const getBooking = (slot: string) => dayBookings.find(b => b.slot === slot) ?? null;

    const otherUser = (booking: BookingRecord | null) => booking !== null && booking.email !== userEmail;

    if (!bookable || allSlotsClosed) {
      if (weekend) {
        return (
          <div key={key} className="relative aspect-square flex gap-0.5">
            <div className="flex flex-col items-center justify-center rounded-lg text-xs font-medium flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600">
              <span>{d}</span>
              <span className="text-[10px] leading-tight">AM</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg text-xs font-medium flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600">
              <span>{d}</span>
              <span className="text-[10px] leading-tight">PM</span>
            </div>
          </div>
        );
      }
      return (
        <div
          key={key}
          className="relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600"
        >
          <span>{d}</span>
          <span className="text-[8px] leading-none mt-0.5 opacity-60">closed</span>
        </div>
      );
    }

    if (weekend) {
      const amBooking = getBooking("morning");
      const pmBooking = getBooking("evening");
      const amOther = otherUser(amBooking);
      const pmOther = otherUser(pmBooking);
      const amClosed = isSlotClosed("weekend", "morning");
      const pmClosed = isSlotClosed("weekend", "evening");
      const amUrgent = urgentDays.has(`${dateStr}_morning`);
      const pmUrgent = urgentDays.has(`${dateStr}_evening`);
      return (
        <div
          key={key}
          className="relative aspect-square flex gap-0.5"
        >
          {amClosed ? (
            <div className="relative flex flex-col items-center justify-center rounded-lg text-xs font-medium flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600">
              {amUrgent && (
                <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-yellow-500 z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>
                </svg>
              )}
              <span>{d}</span>
              <span className="text-[10px] leading-tight">AM</span>
            </div>
          ) : (
            <button
              onClick={() => onSlotClick(year, month, d, "morning", amBooking)}
              className={`relative flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors flex-1
                ${amBooking ? (amOther ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300") : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"}
              `}
            >
              {amUrgent && (
                <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-yellow-500 z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>
                </svg>
              )}
              <span className={`${todayMatch ? "text-blue-600 font-bold" : ""} ${amBooking ? "font-semibold" : ""}`}>{d}</span>
              <span className="text-[10px] leading-tight">AM</span>
            </button>
          )}
          {pmClosed ? (
            <div className="relative flex flex-col items-center justify-center rounded-lg text-xs font-medium flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600">
              {pmUrgent && (
                <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-yellow-500 z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>
                </svg>
              )}
              <span>{d}</span>
              <span className="text-[10px] leading-tight">PM</span>
            </div>
          ) : (
            <button
              onClick={() => onSlotClick(year, month, d, "evening", pmBooking)}
              className={`relative flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors flex-1
                ${pmBooking ? (pmOther ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300") : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"}
              `}
            >
              {pmUrgent && (
                <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-yellow-500 z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>
                </svg>
              )}
              <span className={`${todayMatch ? "text-blue-600 font-bold" : ""} ${pmBooking ? "font-semibold" : ""}`}>{d}</span>
              <span className="text-[10px] leading-tight">PM</span>
            </button>
          )}
        </div>
      );
    }

    const defaultBooking = getBooking("default");
    const booked = defaultBooking !== null;
    const bookedOther = otherUser(defaultBooking);
    const weekdaySlotClosed = isSlotClosed("weekday", "default");

    if (weekdaySlotClosed) {
      return (
        <div
          key={key}
          className="relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600"
        >
          <span>{d}</span>
          <span className="text-[8px] leading-none mt-0.5 opacity-60">closed</span>
        </div>
      );
    }

    return (
      <div
        key={key}
        onClick={() => onSlotClick(year, month, d, "default", defaultBooking)}
        className={`
          relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors cursor-pointer
          ${booked ? (bookedOther ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800") : "hover:bg-blue-50 dark:hover:bg-blue-950"}
          ${!booked && todayMatch ? "bg-blue-600 text-white font-semibold hover:bg-blue-700" : ""}
          ${!booked && !todayMatch ? "text-zinc-800 dark:text-zinc-200" : ""}
        `}
      >
        <span className={`${booked ? "font-semibold" : ""}`}>{d}</span>
        {booked && <span className="text-[8px] leading-none mt-0.5 opacity-75">booked</span>}
        {urgentDays.has(`${dateStr}_default`) && (
          <svg className="absolute top-0.5 right-0.5 w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-w-0 flex gap-6">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (d === null ? <div key={i} /> : renderDay(d, i)))}
        </div>
      </div>

      <div className="w-48 shrink-0 hidden lg:block">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Available Days</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-3 max-h-[420px] overflow-y-auto">
          {availableDays.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">No available days</p>
          ) : (
            <div className="flex flex-col gap-1">
              {availableDays.map(d => {
                const weekend = isWeekend(year, month, d);
                const dayBookings = bookingsByDay[d] ?? [];
                const date = new Date(year, month, d);
                const label = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <button
                    key={d}
                    onClick={() => {
                      if (weekend) {
                        const amBooked = dayBookings.some(b => b.slot === "morning");
                        const pmBooked = dayBookings.some(b => b.slot === "evening");
                        if (!amBooked) onSlotClick(year, month, d, "morning", null);
                        else onSlotClick(year, month, d, "evening", null);
                      } else {
                        onSlotClick(year, month, d, "default", null);
                      }
                    }}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left
                      ${isToday(d)
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    <span>{label}</span>
                    {weekend ? (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {!dayBookings.some(b => b.slot === "morning") ? "AM" : "PM"}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Calendar({ onSwitchView }: { onSwitchView?: (view: "list" | "calendar") => void }) {
  const today = new Date();
  const { data: session } = useSession();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [urgentDays, setUrgentDays] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("default");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [form, setForm] = useState({ email: "" });

  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const canBookNextMonth = today.getDate() >= 25;
  const maxDate = new Date(today.getFullYear(), today.getMonth() + (canBookNextMonth ? 2 : 1), 0);
  const minYear = minDate.getFullYear();
  const minMonth = minDate.getMonth();
  const maxYear = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();

  const atMin = year === minYear && month === minMonth;
  const atMax = year === maxYear && month === maxMonth;

  const fetchMonth = async (y: number, m: number) => {
    const res = await fetch(`/api/bookings?year=${y}&month=${m}`);
    if (res.ok) {
      const data = await res.json();
      return { bookings: data.bookings as BookingRecord[], operatingHours: data.operatingHours as OperatingHours[], urgentDays: (data.urgentDays ?? []) as { date: string; slot: string }[] };
    }
    return { bookings: [] as BookingRecord[], operatingHours: [] as OperatingHours[], urgentDays: [] as { date: string; slot: string }[] };
  };

  const loadBookings = async () => {
    const results = await fetchMonth(year, month);
    setBookings(results.bookings);
    setOperatingHours(results.operatingHours);
    setUrgentDays(new Set(results.urgentDays.map(u => `${u.date}_${u.slot}`)));
  };

  useEffect(() => { loadBookings(); }, [year, month]);

  const bookingsByDay = (targetYear: number, targetMonth: number) => {
    const map: Record<number, BookingRecord[]> = {};
    for (const b of bookings) {
      const iso = b.date.endsWith("Z") ? b.date : b.date + "Z";
      const d = new Date(iso);
      if (d.getUTCFullYear() === targetYear && d.getUTCMonth() === targetMonth) {
        const day = d.getUTCDate();
        if (!map[day]) map[day] = [];
        map[day].push(b);
      }
    }
    return map;
  };

  const openBooking = (y: number, m: number, d: number, slot: string, booking: BookingRecord | null) => {
    setSelectedDate({ year: y, month: m, day: d });
    setSelectedSlot(slot);
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Calendar</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Sign in to view and manage bookings</p>
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

  return (
    <>
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-end mb-4 gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {session.user.email}
          </span>
          <Link href="/profile" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Profile
          </Link>
          {onSwitchView ? (
            <button onClick={() => onSwitchView("list")} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              List view
            </button>
          ) : (
            <Link href="/bookings" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              List view
            </Link>
          )}
          <Link href="/admin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Admin
          </Link>
          <button onClick={() => signOut()} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Sign out
          </button>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }} className={`p-2 rounded-lg transition-colors ${atMin ? "pointer-events-none opacity-30" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{new Date(year, month).toLocaleDateString("en-US", { year: "numeric" })}</span>
          <button onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }} className={`p-2 rounded-lg transition-colors ${atMax ? "pointer-events-none opacity-30" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <MonthGrid year={year} month={month} minDate={minDate} maxDate={maxDate} bookingsByDay={bookingsByDay(year, month)} onSlotClick={openBooking} userEmail={session?.user?.email} operatingHours={operatingHours} urgentDays={urgentDays} />
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
                  {session?.user?.email === selectedBooking.email && !selectedBooking.checkedInAt && (() => {
                    const bd = new Date(selectedBooking.date.endsWith("Z") ? selectedBooking.date : selectedBooking.date + "Z");
                    const now = new Date();
                    const isPast = bd.getUTCFullYear() < now.getUTCFullYear() || (bd.getUTCFullYear() === now.getUTCFullYear() && (bd.getUTCMonth() < now.getUTCMonth() || (bd.getUTCMonth() === now.getUTCMonth() && bd.getUTCDate() < now.getUTCDate())));
                    return (
                      <button
                        onClick={handleDelete}
                        disabled={isPast}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${isPast ? "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                      >
                        Cancel
                      </button>
                    );
                  })()}
                </div>
                {(() => {
                  const d = new Date(selectedBooking.date.endsWith("Z") ? selectedBooking.date : selectedBooking.date + "Z");
                  const weekend = isWeekend(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                  const dayType = weekend ? "weekend" : "weekday";
                  const slot = selectedBooking.slot === "default" ? "default" : selectedBooking.slot;
                  const hours = operatingHours.find(h => h.dayType === dayType && (slot === "default" ? h.slot === "default" : h.slot === slot));
                  const openTime = hours?.openTime ?? (slot === "morning" ? "09:00" : "09:00");
                  const closeTime = hours?.closeTime ?? (slot === "evening" ? "17:00" : "17:00");
                  const url = buildGoogleCalendarUrl({
                    title: `High Hill Pham - ${selectedBooking.slot === "default" ? "Booking" : selectedBooking.slot.charAt(0).toUpperCase() + selectedBooking.slot.slice(1)}`,
                    date: selectedBooking.date,
                    slot: selectedBooking.slot,
                    name: selectedBooking.name ?? undefined,
                    openTime,
                    closeTime,
                  });
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      Add to Google Calendar
                    </a>
                  );
                })()}
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
    </>
  );
}
