import { addMinutes, format, parse, isAfter, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import type { Booking, Service, WorkSchedule } from "./types";

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** True if [start, start+duration) intervals overlap. */
export function intervalsOverlap(
  startA: string,
  durationA: number,
  startB: string,
  durationB: number
): boolean {
  const a0 = timeToMinutes(startA);
  const a1 = a0 + durationA;
  const b0 = timeToMinutes(startB);
  const b1 = b0 + durationB;
  return a0 < b1 && b0 < a1;
}

function bookingDuration(booking: Booking, fallback: number): number {
  return booking.service_duration || fallback;
}

export function hasBookingConflict(
  candidateTime: string,
  candidateDuration: number,
  existingBookings: Booking[],
  dateStr: string,
  fallbackDuration: number
): boolean {
  return existingBookings.some((b) => {
    if (b.date !== dateStr || b.status === "cancelled") return false;
    return intervalsOverlap(
      candidateTime,
      candidateDuration,
      b.time,
      bookingDuration(b, fallbackDuration)
    );
  });
}

export function getAvailableSlots(
  dateStr: string,
  schedule: WorkSchedule,
  service: Service,
  existingBookings: Booking[],
  slotDuration: number
): string[] {
  return getDaySlotOverview(
    dateStr,
    schedule,
    service.duration || slotDuration,
    existingBookings,
    slotDuration
  )
    .filter((s) => s.status === "free")
    .map((s) => s.time);
}

export type SlotOverviewStatus = "free" | "busy" | "past";

export type SlotOverviewItem = {
  time: string;
  status: SlotOverviewStatus;
  client_name?: string;
  booking_status?: string;
};

/** All slots in a work day with free / busy / past status (for master calendar). */
export function getDaySlotOverview(
  dateStr: string,
  schedule: WorkSchedule,
  stepDuration: number,
  existingBookings: Booking[],
  slotDuration: number
): SlotOverviewItem[] {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayKey = DAY_MAP[date.getDay()];
  const daySchedule = schedule[dayKey];

  if (!daySchedule?.enabled) return [];

  const start = parse(daySchedule.start, "HH:mm", date);
  const end = parse(daySchedule.end, "HH:mm", date);

  const items: SlotOverviewItem[] = [];
  let current = start;
  const now = new Date();
  const isToday = format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

  while (addMinutes(current, stepDuration) <= end) {
    const timeStr = format(current, "HH:mm");
    const booking = existingBookings.find(
      (b) =>
        b.date === dateStr &&
        b.status !== "cancelled" &&
        intervalsOverlap(
          timeStr,
          stepDuration,
          b.time,
          bookingDuration(b, slotDuration)
        )
    );

    if (isToday && !isAfter(current, now)) {
      items.push({ time: timeStr, status: "past" });
    } else if (booking) {
      items.push({
        time: timeStr,
        status: "busy",
        client_name: booking.client_name,
        booking_status: booking.status,
      });
    } else {
      items.push({ time: timeStr, status: "free" });
    }

    current = addMinutes(current, stepDuration);
  }

  return items;
}

export function getAvailableDates(
  schedule: WorkSchedule,
  daysAhead = 30
): { date: string; label: string }[] {
  const dates: { date: string; label: string }[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < daysAhead; i++) {
    const date = addMinutes(today, i * 24 * 60);
    const dayKey = DAY_MAP[date.getDay()];
    const daySchedule = schedule[dayKey];

    if (daySchedule?.enabled) {
      dates.push({
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "d MMM, EEE", { locale: ru }),
      });
    }
  }

  return dates;
}

export function formatBookingDate(dateStr: string, timeStr: string): string {
  const date = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date());
  return format(date, "d MMMM yyyy, HH:mm", { locale: ru });
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,29}$/.test(slug);
}

export { isValidPhone } from "@/lib/validate";

export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
