import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import {
  sendMaxNotification,
  sendVkNotification,
  type NotificationPayload,
} from "@/lib/notifications";

export type OutboxChannel = "max" | "vk" | "reminder_master";

export type OutboxPayload = NotificationPayload;

export function enqueueNotification(input: {
  channel: OutboxChannel;
  recipient: string;
  payload: OutboxPayload;
  bookingId?: string;
  availableAt?: Date;
}) {
  if (!input.recipient) return null;

  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO notification_outbox
        (id, channel, recipient, payload, booking_id, status, attempts, available_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)`
    )
    .run(
      id,
      input.channel,
      input.recipient,
      JSON.stringify(input.payload),
      input.bookingId || input.payload.bookingId || "",
      (input.availableAt || new Date()).toISOString(),
      now
    );
  return id;
}

type OutboxRow = {
  id: string;
  channel: OutboxChannel;
  recipient: string;
  payload: string;
  booking_id: string;
  attempts: number;
};

async function deliver(row: OutboxRow): Promise<boolean> {
  const payload = JSON.parse(row.payload) as OutboxPayload;

  if (row.channel === "max") {
    return sendMaxNotification(row.recipient, payload);
  }
  if (row.channel === "vk") {
    return sendVkNotification(row.recipient, payload);
  }
  if (row.channel === "reminder_master") {
    // Prefer MAX, fallback VK — same message format with kind prefix
    const textPayload: OutboxPayload = {
      ...payload,
      kind: payload.kind || "reminder_24h",
    };
    if (row.recipient.startsWith("max:")) {
      return sendMaxNotification(row.recipient.slice(4), textPayload);
    }
    if (row.recipient.startsWith("vk:")) {
      return sendVkNotification(row.recipient.slice(3), textPayload);
    }
    return sendMaxNotification(row.recipient, textPayload);
  }
  return false;
}

/** Process due outbox rows. Safe to call often (after booking + cron). */
export async function flushOutbox(limit = 20): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date().toISOString();
  const rows = getDb()
    .prepare(
      `SELECT id, channel, recipient, payload, booking_id, attempts
       FROM notification_outbox
       WHERE status = 'pending' AND available_at <= ?
       ORDER BY available_at ASC
       LIMIT ?`
    )
    .all(now, limit) as unknown as OutboxRow[];

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    getDb()
      .prepare(
        "UPDATE notification_outbox SET attempts = attempts + 1 WHERE id = ?"
      )
      .run(row.id);

    try {
      const ok = await deliver(row);
      if (ok) {
        getDb()
          .prepare(
            `UPDATE notification_outbox
             SET status = 'sent', sent_at = ?, last_error = ''
             WHERE id = ?`
          )
          .run(new Date().toISOString(), row.id);
        sent += 1;
      } else {
        const attempts = row.attempts + 1;
        if (attempts >= 8) {
          getDb()
            .prepare(
              `UPDATE notification_outbox
               SET status = 'failed', last_error = ?
               WHERE id = ?`
            )
            .run("max attempts reached", row.id);
        } else {
          const delayMin = Math.min(60, 2 ** Math.min(attempts, 5));
          const next = new Date(Date.now() + delayMin * 60_000).toISOString();
          getDb()
            .prepare(
              `UPDATE notification_outbox
               SET last_error = ?, available_at = ?
               WHERE id = ?`
            )
            .run("delivery returned false", next, row.id);
        }
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "unknown";
      getDb()
        .prepare(
          `UPDATE notification_outbox SET last_error = ?, available_at = ? WHERE id = ?`
        )
        .run(
          message,
          new Date(Date.now() + 5 * 60_000).toISOString(),
          row.id
        );
    }
  }

  return { processed: rows.length, sent, failed };
}
