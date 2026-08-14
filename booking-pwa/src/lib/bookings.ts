import { v4 as uuidv4 } from "uuid";
import { getMasterById, getMasterBySlug } from "@/lib/auth";
import { getDb, withTransaction } from "@/lib/db";
import { resolveNotifyTarget } from "@/lib/notify-channel";
import { enqueueNotification, flushOutbox } from "@/lib/outbox";
import { isMasterBookingAllowed, planHasReminders, syncMasterSubscription } from "@/lib/subscription";
import { normalizeRuPhone } from "@/lib/validate";
import {
  formatBookingDate,
  hasBookingConflict,
  isValidDate,
  isValidTime,
} from "@/lib/slots";
import type { Booking, Master, Service } from "@/lib/types";

export type CreateBookingInput = {
  slug: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
};

export type CreateBookingResult =
  | { ok: true; id: string; manage_token: string }
  | { ok: false; error: string; status: number };

export function createBooking(input: CreateBookingInput): CreateBookingResult {
  const { slug, service_id, client_name, client_phone, date, time } = input;

  if (!slug || !service_id || !client_name || !client_phone || !date || !time) {
    return { ok: false, error: "Заполните все поля", status: 400 };
  }
  const phoneNorm = normalizeRuPhone(client_phone);
  if (!phoneNorm) {
    return { ok: false, error: "Телефон: +7 и 10 цифр", status: 400 };
  }
  if (!isValidDate(date) || !isValidTime(time)) {
    return { ok: false, error: "Некорректная дата или время", status: 400 };
  }

  const master = getMasterBySlug(slug);
  if (!master) {
    return { ok: false, error: "Мастер не найден", status: 404 };
  }

  if (!isMasterBookingAllowed(master.id)) {
    return {
      ok: false,
      error: "Онлайн-запись временно недоступна",
      status: 403,
    };
  }

  const service = getDb()
    .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
    .get(service_id, master.id) as Service | undefined;

  if (!service) {
    return { ok: false, error: "Услуга не найдена", status: 404 };
  }

  const duration = service.duration || master.slot_duration || 60;
  const id = uuidv4();
  const manageToken = uuidv4().replace(/-/g, "");
  const now = new Date().toISOString();

  try {
    withTransaction((database) => {
      const existing = database
        .prepare(
          "SELECT * FROM bookings WHERE master_id = ? AND date = ? AND status != 'cancelled'"
        )
        .all(master.id, date) as unknown as Booking[];

      if (
        hasBookingConflict(time, duration, existing, date, master.slot_duration)
      ) {
        throw Object.assign(new Error("SLOT_TAKEN"), { code: "SLOT_TAKEN" });
      }

      database
        .prepare(
          `INSERT INTO bookings (
            id, master_id, service_id, service_name, service_duration,
            client_name, client_phone, date, time, status, manage_token, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
        )
        .run(
          id,
          master.id,
          service.id,
          service.name,
          duration,
          client_name.trim(),
          phoneNorm,
          date,
          time,
          manageToken,
          now
        );
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ((error as { code?: string }).code === "SLOT_TAKEN" ||
        /UNIQUE|constraint/i.test(String(error)))
    ) {
      return {
        ok: false,
        error: "Это время уже занято, выберите другое",
        status: 409,
      };
    }
    throw error;
  }

  queueBookingNotifications(master, id, {
    clientName: client_name.trim(),
    clientPhone: phoneNorm,
    serviceName: service.name,
    date,
    time,
  });

  void flushOutbox().catch((error) => {
    console.error("Outbox flush after booking failed:", error);
  });

  return { ok: true, id, manage_token: manageToken };
}

function queueBookingNotifications(
  master: Master,
  bookingId: string,
  data: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    date: string;
    time: string;
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const formattedDate = formatBookingDate(data.date, data.time);
  const payload = {
    masterName: master.name,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    serviceName: data.serviceName,
    date: formattedDate.split(",")[0],
    time: data.time,
    pageUrl: `${baseUrl}/m/${master.slug}`,
    bookingId,
    kind: "new_booking" as const,
  };

  const target = resolveNotifyTarget(master);
  if (target) {
    enqueueNotification({
      channel: target.channel,
      recipient: target.recipient,
      payload,
      bookingId,
    });
  }

  const visitAt = new Date(`${data.date}T${data.time}:00`);
  const sub = syncMasterSubscription(master.id);
  if (
    target &&
    !Number.isNaN(visitAt.getTime()) &&
    planHasReminders(sub?.plan)
  ) {
    const at24 = new Date(visitAt.getTime() - 24 * 60 * 60_000);
    const at2 = new Date(visitAt.getTime() - 2 * 60 * 60_000);
    const recipient = `${target.channel}:${target.recipient}`;
    if (at24 > new Date()) {
      enqueueNotification({
        channel: "reminder_master",
        recipient,
        payload: { ...payload, kind: "reminder_24h" },
        bookingId,
        availableAt: at24,
      });
    }
    if (at2 > new Date()) {
      enqueueNotification({
        channel: "reminder_master",
        recipient,
        payload: { ...payload, kind: "reminder_2h" },
        bookingId,
        availableAt: at2,
      });
    }
  }
}

export function updateBookingStatus(
  bookingId: string,
  masterId: string,
  status: "pending" | "confirmed" | "cancelled"
): Booking | null {
  const booking = getDb()
    .prepare("SELECT * FROM bookings WHERE id = ? AND master_id = ?")
    .get(bookingId, masterId) as Booking | undefined;
  if (!booking) return null;

  getDb()
    .prepare("UPDATE bookings SET status = ? WHERE id = ?")
    .run(status, bookingId);

  return getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(bookingId) as unknown as Booking;
}

export type PublicBookingView = {
  id: string;
  service_name: string;
  client_name: string;
  date: string;
  time: string;
  status: Booking["status"];
  master_name: string;
  master_slug: string;
  manage_token: string;
};

export function getBookingByManageToken(
  token: string
): PublicBookingView | null {
  if (!token || token.length < 16) return null;
  const row = getDb()
    .prepare(
      `SELECT b.id, b.service_name, b.client_name, b.date, b.time, b.status,
              b.manage_token, m.name as master_name, m.slug as master_slug
       FROM bookings b
       JOIN masters m ON m.id = b.master_id
       WHERE b.manage_token = ?`
    )
    .get(token) as PublicBookingView | undefined;
  return row || null;
}

export function cancelBookingByManageToken(
  token: string
):
  | { ok: true; booking: PublicBookingView }
  | { ok: false; error: string; status: number } {
  const view = getBookingByManageToken(token);
  if (!view) {
    return { ok: false, error: "Запись не найдена", status: 404 };
  }
  if (view.status === "cancelled") {
    return { ok: false, error: "Запись уже отменена", status: 409 };
  }

  const full = getDb()
    .prepare("SELECT * FROM bookings WHERE manage_token = ?")
    .get(token) as unknown as Booking;

  getDb()
    .prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?")
    .run(full.id);

  // drop pending reminders for this booking
  getDb()
    .prepare(
      "UPDATE notification_outbox SET status = 'cancelled' WHERE booking_id = ? AND status = 'pending'"
    )
    .run(full.id);

  const master = getMasterById(full.master_id);
  if (master) {
    queueCancelNotifications(master, full);
    void flushOutbox().catch((error) => {
      console.error("Outbox flush after client cancel failed:", error);
    });
  }

  const updated = getBookingByManageToken(token)!;
  return { ok: true, booking: updated };
}

function queueCancelNotifications(master: Master, booking: Booking) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const formattedDate = formatBookingDate(booking.date, booking.time);
  const payload = {
    masterName: master.name,
    clientName: booking.client_name,
    clientPhone: booking.client_phone,
    serviceName: booking.service_name,
    date: formattedDate.split(",")[0],
    time: booking.time,
    pageUrl: `${baseUrl}/m/${master.slug}`,
    bookingId: booking.id,
    kind: "cancelled_by_client" as const,
  };

  const target = resolveNotifyTarget(master);
  if (!target) return;
  enqueueNotification({
    channel: target.channel,
    recipient: target.recipient,
    payload,
    bookingId: booking.id,
  });
}
