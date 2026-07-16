function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatIcsDate(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function buildIcsFile(events: {
  title: string;
  date: string;
  openTime: string;
  closeTime: string;
  name?: string;
}[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//High Hill Pham//Bookings//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const evt of events) {
    const d = new Date(evt.date);
    const [sh, sm] = evt.openTime.split(":").map(Number);
    const [eh, em] = evt.closeTime.split(":").map(Number);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em);

    const uid = `${evt.date}-${evt.title.replace(/\s/g, "")}@highhillpham`;
    const now = formatIcsDate(new Date());

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${evt.title}`,
      `DESCRIPTION:Booked by ${evt.name ?? "N/A"}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
