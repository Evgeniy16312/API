"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { DAY_KEYS, DAY_LABELS, DEFAULT_SCHEDULE } from "@/lib/types";
import type { WorkSchedule, WorkDay } from "@/lib/types";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<WorkSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/api/masters/me")
      .then((m) => setSchedule(m.work_schedule || DEFAULT_SCHEDULE))
      .finally(() => setLoading(false));
  }, []);

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
        body: JSON.stringify({ work_schedule: schedule }),
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
      <h1 className="text-xl font-bold">Расписание</h1>
      <p className="text-sm text-[#6b7280]">
        Когда вы принимаете клиентов
      </p>

      <div className="space-y-2">
        {DAY_KEYS.map((day) => {
          const d = schedule[day] || { enabled: false, start: "10:00", end: "19:00" };
          return (
            <div key={day} className="card">
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

      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? "Сохраняем..." : saved ? "✓ Сохранено" : "Сохранить"}
      </button>
    </div>
  );
}
