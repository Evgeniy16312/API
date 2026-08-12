"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { apiFetch } from "@/lib/client";
import { DAY_KEYS, DAY_LABELS, DEFAULT_SCHEDULE } from "@/lib/types";
import type { WorkSchedule, WorkDay, Service } from "@/lib/types";
import { getAvailableDates, getAvailableSlots } from "@/lib/slots";
import MonthCalendar from "@/components/MonthCalendar";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<WorkSchedule>(DEFAULT_SCHEDULE);
  const [slotDuration, setSlotDuration] = useState(60);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [previewDate, setPreviewDate] = useState("");
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([apiFetch("/api/masters/me"), apiFetch("/api/services")])
      .then(([m, s]) => {
        setSchedule(m.work_schedule || DEFAULT_SCHEDULE);
        setSlotDuration(m.slot_duration || 60);
        setServices(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const availableDates = useMemo(
    () => getAvailableDates(schedule, 60).map((d) => d.date),
    [schedule]
  );

  useEffect(() => {
    if (!previewDate) {
      setPreviewSlots([]);
      return;
    }
    const duration = services[0]?.duration || slotDuration;
    const fakeService = {
      id: "preview",
      master_id: "",
      name: "preview",
      duration,
      price: 0,
      sort_order: 0,
    };
    setPreviewSlots(
      getAvailableSlots(previewDate, schedule, fakeService, [], slotDuration)
    );
  }, [previewDate, schedule, services, slotDuration]);

  function updateDay(day: string, field: keyof WorkDay, value: boolean | string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/masters/me", {
        method: "PATCH",
        body: JSON.stringify({
          work_schedule: schedule,
          slot_duration: slotDuration,
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Календарь работы</h1>
        <p className="text-sm text-[#6b7280]">
          Отметьте дни и часы — клиент увидит свободные слоты при записи
        </p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-sm">Календарь на месяц</h2>
        <MonthCalendar
          availableDates={availableDates}
          selectedDate={previewDate}
          onSelect={setPreviewDate}
          month={month}
          onMonthChange={setMonth}
        />
        {previewDate && (
          <div className="pt-2 border-t border-[#e8e6e3]">
            <p className="text-sm text-[#6b7280] mb-2">
              Слоты на{" "}
              {format(parse(previewDate, "yyyy-MM-dd", new Date()), "d MMMM", {
                locale: ru,
              })}
              {services[0] ? ` (${services[0].name}, ${services[0].duration} мин)` : ""}
            </p>
            {previewSlots.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Нет слотов в этот день</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {previewSlots.map((t) => (
                  <span key={t} className="slot-btn slot-btn-active cursor-default">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <label className="text-sm font-semibold" htmlFor="slot-duration">
          Длина слота по умолчанию
        </label>
        <select
          id="slot-duration"
          className="input"
          value={slotDuration}
          onChange={(e) => {
            setSlotDuration(Number(e.target.value));
            setSaved(false);
          }}
        >
          {[30, 45, 60, 90, 120].map((m) => (
            <option key={m} value={m}>
              {m} минут
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm px-1">Рабочие дни недели</h2>
        {DAY_KEYS.map((day) => {
          const d =
            schedule[day] || { enabled: false, start: "10:00", end: "19:00" };
          return (
            <div key={day} className="card" data-testid={`schedule-day-${day}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">{DAY_LABELS[day]}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                    className="w-4 h-4 accent-[#c9a96e]"
                  />
                  <span className="text-xs text-[#6b7280]">
                    {d.enabled ? "Работаю" : "Выходной"}
                  </span>
                </label>
              </div>
              {d.enabled && (
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={d.start}
                    onChange={(e) => updateDay(day, "start", e.target.value)}
                    className="input text-sm py-2"
                  />
                  <span className="text-[#6b7280]">—</span>
                  <input
                    type="time"
                    value={d.end}
                    onChange={(e) => updateDay(day, "end", e.target.value)}
                    className="input text-sm py-2"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary w-full"
        data-testid="schedule-save"
      >
        {saving ? "Сохраняем..." : saved ? "✓ Сохранено" : "Сохранить"}
      </button>
    </div>
  );
}
