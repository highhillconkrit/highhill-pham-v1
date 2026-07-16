export function buildGoogleCalendarUrl(opts: {
  title: string;
  date: string;
  slot: string;
  name?: string;
  openTime: string;
  closeTime: string;
}) {
  const d = new Date(opts.date);
  const [sh, sm] = opts.openTime.split(":").map(Number);
  const [eh, em] = opts.closeTime.split(":").map(Number);

  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em);

  const fmt = (dt: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Booked by ${opts.name ?? opts.slot}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
