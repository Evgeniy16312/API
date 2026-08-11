import { addMinutes, format, parse, isBefore, isAfter, startOfDay } from "date-fns";
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

export function getAvailableSlots(
  dateStr: string,
  schedule: WorkSchedule,
  service: Service,
  existingBookings: Booking[],
  slotDuration: number
): string[] {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayKey = DAY_MAP[date.getDay()];
  const daySchedule = schedule[dayKey];

  if (!daySchedule?.enabled) return [];

  const duration = service.duration || slotDuration;
  const start = parse(daySchedule.start, "HH:mm", date);
  const end = parse(daySchedule.end, "HH:mm", date);

  const bookedTimes = new Set(
    existingBookings
      .filter((b) => b.date === dateStr && b.status !== "cancelled")
      .map((b) => b.time)
  );

  const slots: string[] = [];
  let current = start;
  const now = new Date();
  const isToday = format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

  while (addMinutes(current, duration) <= end) {
    const timeStr = format(current, "HH:mm");

    if (!bookedTimes.has(timeStr)) {
      if (!isToday || isAfter(current, now)) {
        slots.push(timeStr);
      }
    }

    current = addMinutes(current, duration);
  }

  return slots;
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

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}
