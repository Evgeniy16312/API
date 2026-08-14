"use client";

import { useMemo } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  /** yyyy-MM-dd values that are selectable (working days) */
  availableDates: string[];
  selectedDate?: string;
  onSelect: (date: string) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function MonthCalendar({
  availableDates,
  selectedDate,
  onSelect,
  month,
  onMonthChange,
}: Props) {
  const available = useMemo(() => new Set(availableDates), [availableDates]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div data-testid="month-calendar" className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="btn-outline px-3 py-1.5 text-sm"
          onClick={() => onMonthChange(addDays(startOfMonth(month), -1))}
          aria-label="Предыдущий месяц"
        >
          ←
        </button>
        <span className="font-medium capitalize">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button
          type="button"
          className="btn-outline px-3 py-1.5 text-sm"
          onClick={() => onMonthChange(addDays(endOfMonth(month), 1))}
          aria-label="Следующий месяц"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#78716c]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const value = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const canSelect = available.has(value);
          const selected = selectedDate === value;
          const today = isSameDay(day, new Date());

          return (
            <button
              key={value}
              type="button"
              disabled={!canSelect}
              onClick={() => onSelect(value)}
              className={[
                "min-h-11 rounded-xl text-sm transition-all",
                !inMonth && "opacity-30",
                canSelect && !selected && "bg-[color-mix(in_srgb,var(--mz-accent)_18%,transparent)] text-[var(--mz-ink)] font-medium",
                !canSelect && "text-[#d6d3d1] cursor-default",
                selected && "bg-[var(--mz-ink)] text-[var(--mz-bg)] font-semibold",
                today && !selected && "ring-1 ring-[var(--mz-accent)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
