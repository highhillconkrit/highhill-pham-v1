"use client";

import Calendar from "@/app/components/Calendar";
import dynamic from "next/dynamic";

const BookingsPage = dynamic(() => import("@/app/bookings/page"), { ssr: false });

export default function Home() {
  return (
    <>
      <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <Calendar />
      </div>
      <div className="flex md:hidden flex-1 bg-zinc-50 dark:bg-black">
        <BookingsPage />
      </div>
    </>
  );
}
