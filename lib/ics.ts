const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => "\\" + m);

export function buildIcs(opts: {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  location: string;
  organizerEmail?: string;
  attendees: { name: string; email: string }[];
  method?: "REQUEST" | "CANCEL";
  sequence?: number;
}) {
  const method = opts.method ?? "REQUEST";
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Divide//Careers//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `SEQUENCE:${opts.sequence ?? 0}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(opts.start)}`,
    `DTEND:${stamp(opts.end)}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    `LOCATION:${esc(opts.location)}`,
    `URL:${opts.location}`,
    `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    ...(opts.organizerEmail ? [`ORGANIZER;CN=Divide:mailto:${opts.organizerEmail}`] : []),
    ...opts.attendees.map((a) => `ATTENDEE;CN=${esc(a.name)};RSVP=TRUE:mailto:${a.email}`),
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Interview reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
