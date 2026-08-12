"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import type { PortfolioItem, Review, Service } from "@/lib/types";
import MonthCalendar from "@/components/MonthCalendar";
import ReviewsSection from "@/components/ReviewsSection";

const MasterMap = dynamic(() => import("@/components/MasterMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-xl bg-[#faf9f7] border border-[#e8e6e3] animate-pulse" />
  ),
});

interface MasterData {
  id: string;
  slug: string;
  name: string;
  phone: string;
  specialty: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string;
  avatar_url: string;
  vk_user_id?: string;
  services: Service[];
  portfolio: PortfolioItem[];
  reviews?: Review[];
}

type Step = "service" | "datetime" | "contact" | "done";

export default function BookingFlow({ slug }: { slug: string }) {
  const [master, setMaster] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [manageUrl, setManageUrl] = useState("");

  useEffect(() => {
    fetch(`/api/masters/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMaster(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!selectedService) return;
    fetch(`/api/slots?slug=${encodeURIComponent(slug)}&service_id=${selectedService.id}`)
      .then((r) => r.json())
      .then((data) => {
        const dates = (data.dates || []).map(
          (d: { date: string } | string) =>
            typeof d === "string" ? d : d.date
        );
        setAvailableDates(dates);
      })
      .catch(() => setAvailableDates([]));
  }, [selectedService, slug]);

  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    fetch(
      `/api/slots?slug=${encodeURIComponent(slug)}&service_id=${selectedService.id}&date=${selectedDate}`
    )
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]));
  }, [selectedService, selectedDate, slug]);

  async function submitBooking() {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          service_id: selectedService.id,
          client_name: clientName,
          client_phone: clientPhone,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.manage_token) {
        setManageUrl(`${window.location.origin}/b/${data.manage_token}`);
      }
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка записи");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !master) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-[#dc2626]">{error}</p>
      </div>
    );
  }

  if (!master) return null;

  const hasMap = master.lat != null && master.lng != null;

  return (
    <div>
      <div className="bg-[#1a1a2e] text-white px-6 pt-8 pb-10 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-4">
          {master.avatar_url ? (
            <img
              src={master.avatar_url}
              alt={master.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#c9a96e]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#c9a96e] flex items-center justify-center text-3xl">
              {master.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{master.name}</h1>
            {master.specialty && (
              <p className="text-[#c9a96e] text-sm">{master.specialty}</p>
            )}
          </div>
        </div>
        {master.address && (
          <p className="text-white/70 text-sm">📍 {master.address}</p>
        )}
        {master.description && (
          <p className="text-white/80 text-sm mt-3 leading-relaxed">
            {master.description}
          </p>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-8">
        {hasMap && (
          <div className="card space-y-2">
            <h2 className="font-semibold">Как добраться</h2>
            <MasterMap
              lat={master.lat as number}
              lng={master.lng as number}
              label={master.name}
            />
            {master.address && (
              <a
                className="text-sm text-[#c9a96e]"
                href={`https://www.openstreetmap.org/?mlat=${master.lat}&mlon=${master.lng}#map=16/${master.lat}/${master.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Открыть в OpenStreetMap →
              </a>
            )}
          </div>
        )}

        {master.portfolio.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3">Портфолио</h2>
            <div className="grid grid-cols-2 gap-2">
              {master.portfolio.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-xl overflow-hidden"
                >
                  <img
                    src={item.image_url}
                    alt={item.caption || "Работа"}
                    className="w-full h-full object-cover"
                  />
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "done" ? (
          <div className="card text-center py-8" data-testid="booking-done">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">Вы записаны!</h2>
            <p className="text-[#6b7280] mb-1">{selectedService?.name}</p>
            <p className="text-[#6b7280]">
              {selectedDate &&
                format(parse(selectedDate, "yyyy-MM-dd", new Date()), "d MMMM", {
                  locale: ru,
                })}{" "}
              в {selectedTime}
            </p>
            <p className="text-sm text-[#6b7280] mt-4">
              Мастер получит уведомление и свяжется с вами при необходимости
            </p>
            {manageUrl && (
              <div className="mt-6 space-y-2 text-left">
                <p className="text-sm text-[#6b7280]">
                  Сохраните ссылку — по ней можно отменить запись:
                </p>
                <a
                  href={manageUrl}
                  className="block text-sm text-[#c9a96e] break-all underline"
                  data-testid="manage-booking-link"
                >
                  {manageUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <h2 className="font-semibold mb-4">Записаться онлайн</h2>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {(step === "service" || !selectedService) && (
              <div className="space-y-2">
                <p className="text-sm text-[#6b7280] mb-2">Выберите услугу и цену</p>
                {master.services.length === 0 ? (
                  <p className="text-[#6b7280] text-sm">Услуги пока не добавлены</p>
                ) : (
                  master.services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedService(s);
                        setStep("datetime");
                        setSelectedDate("");
                        setSelectedTime("");
                      }}
                      className="w-full flex justify-between items-center p-3 rounded-xl border border-[#e8e6e3] hover:border-[#c9a96e] active:scale-[0.99] transition-all text-left"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-[#6b7280]">{s.duration} мин</p>
                      </div>
                      {s.price > 0 && (
                        <span className="font-semibold text-[#c9a96e]">
                          {s.price} ₽
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {step === "datetime" && selectedService && (
              <div>
                <button
                  onClick={() => {
                    setStep("service");
                    setSelectedService(null);
                    setSelectedDate("");
                    setSelectedTime("");
                  }}
                  className="text-sm text-[#c9a96e] mb-3"
                >
                  ← {selectedService.name}
                </button>

                <p className="text-sm text-[#6b7280] mb-2">Выберите день</p>
                <MonthCalendar
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedTime("");
                  }}
                  month={month}
                  onMonthChange={setMonth}
                />

                {selectedDate && (
                  <>
                    <p className="text-sm text-[#6b7280] mb-2 mt-4">Свободное время</p>
                    {slots.length === 0 ? (
                      <p className="text-sm text-[#6b7280]">Нет свободного времени</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slots.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setSelectedTime(t);
                              setStep("contact");
                            }}
                            className={`slot-btn ${
                              selectedTime === t ? "slot-btn-active" : ""
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === "contact" && (
              <div>
                <button
                  onClick={() => setStep("datetime")}
                  className="text-sm text-[#c9a96e] mb-3"
                >
                  ← {selectedDate} в {selectedTime}
                </button>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-[#6b7280] mb-1 block">Ваше имя</label>
                    <input
                      className="input"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Иван"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280] mb-1 block">Телефон</label>
                    <input
                      className="input"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <button
                    onClick={submitBooking}
                    disabled={submitting || !clientName || !clientPhone}
                    className="btn-primary w-full mt-2"
                  >
                    {submitting ? "Записываем..." : "Записаться"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {master.phone && (
          <div className="card text-center space-y-2">
            <p className="text-sm text-[#6b7280]">Есть вопрос?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <a href={`tel:${master.phone}`} className="btn-outline inline-block text-sm">
                Позвонить
              </a>
              {master.vk_user_id && (
                <a
                  href={`https://vk.com/id${master.vk_user_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline inline-block text-sm"
                >
                  Написать в VK
                </a>
              )}
            </div>
          </div>
        )}

        <ReviewsSection slug={slug} initialReviews={master.reviews || []} />
      </div>
    </div>
  );
}
