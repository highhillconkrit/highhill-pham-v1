"use client";

import Calendar from "@/app/components/Calendar";
import dynamic from "next/dynamic";
import { useState } from "react";

const BookingsPage = dynamic(() => import("@/app/bookings/page"), { ssr: false });

export default function Home() {
  const [mobileView, setMobileView] = useState<"list" | "calendar">("list");

  return (
    <>
      <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <Calendar />
      </div>
      <div className="flex md:hidden flex-1 flex-col bg-zinc-50 dark:bg-black">
        <div className="flex items-center justify-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setMobileView("list")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mobileView === "list"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setMobileView("calendar")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mobileView === "calendar"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Calendar
          </button>
        </div>
        {mobileView === "list" ? <BookingsPage /> : (
          <div className="flex-1 overflow-auto p-2">
            <Calendar />
          </div>
        )}
      </div>
    </>
  );
}
