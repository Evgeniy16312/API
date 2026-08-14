import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { sendPlainEmail } from "@/lib/notifications";
import { appBaseUrl } from "@/lib/billing";
import { TRIAL_DAYS } from "@/lib/subscription";

/** Remind masters at these day offsets before trial/paid_until ends. */
export const MASTER_EXPIRY_REMIND_DAYS = [3, 2, 1] as const;

export type MasterExpiryCandidate = {
  id: string;
  name: string;
  slug: string;
  notify_email: string;
  notify_channel: string;
  ends_at: string;
  days_left: number;
  kind: "trial" | "paid";
};

function formatRuDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU");
}

function calendarDaysUntil(ends: Date, now: Date): number {
  const a = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const b = Date.UTC(
    ends.getUTCFullYear(),
    ends.getUTCMonth(),
    ends.getUTCDate()
  );
  return Math.round((b - a) / 86400_000);
}

function digestKey(masterId: string, daysLeft: number, endsAt: string): string {
  return `master_expiry:${daysLeft}d:${masterId}:${endsAt.slice(0, 10)}`;
}

function alreadyLogged(key: string): boolean {
  const row = getDb()
    .prepare("SELECT digest_key FROM owner_alert_log WHERE digest_key = ?")
    .get(key) as { digest_key: string } | undefined;
  return Boolean(row);
}

function record(key: string, masterId: string, daysLeft: number): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO owner_alert_log (id, kind, digest_key, master_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      randomBytes(12).toString("hex"),
      `master_expiry_${daysLeft}d`,
      key,
      masterId,
      new Date().toISOString()
    );
}

export function findMastersNeedingExpiryReminder(
  now = new Date()
): MasterExpiryCandidate[] {
  const rows = getDb()
    .prepare(
      `SELECT id, name, slug, notify_email, notify_channel, plan,
              subscription_status, paid_until, created_at, blocked
       FROM masters
       WHERE blocked = 0
         AND subscription_status IN ('trial', 'active')
       ORDER BY created_at ASC
       LIMIT 500`
    )
    .all() as {
    id: string;
    name: string;
    slug: string;
    notify_email: string;
    notify_channel: string;
    subscription_status: string;
    paid_until: string;
    created_at: string;
  }[];

  const out: MasterExpiryCandidate[] = [];
  for (const row of rows) {
    let ends: Date | null = null;
    let kind: "trial" | "paid" = "trial";
    if (row.paid_until) {
      const until = new Date(row.paid_until);
      if (!Number.isNaN(until.getTime())) {
        ends = until;
        kind = "paid";
      }
    } else if (row.subscription_status === "trial") {
      const start = new Date(row.created_at);
      if (!Number.isNaN(start.getTime())) {
        ends = new Date(start.getTime() + TRIAL_DAYS * 86400_000);
        kind = "trial";
      }
    }
    if (!ends || ends < now) continue;

    const days_left = calendarDaysUntil(ends, now);
    if (!(MASTER_EXPIRY_REMIND_DAYS as readonly number[]).includes(days_left)) {
      continue;
    }

    out.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      notify_email: (row.notify_email || "").trim(),
      notify_channel: row.notify_channel,
      ends_at: ends.toISOString(),
      days_left,
      kind,
    });
  }
  return out;
}

function daysWord(n: number): string {
  if (n === 1) return "1 день";
  if (n === 2 || n === 3) return `${n} дня`;
  return `${n} дней`;
}

export type MasterExpiryFlushResult = {
  candidates: number;
  sent: number;
  skipped_no_email: number;
  skipped_dup: number;
  failed: number;
};

/**
 * Email masters 3 / 2 / 1 day before subscription ends (deduped per day-left).
 */
export async function processMasterExpiryReminders(
  options: { dryRun?: boolean } = {}
): Promise<MasterExpiryFlushResult> {
  const dryRun =
    options.dryRun === true ||
    process.env.MASTER_EXPIRY_DRY_RUN === "1" ||
    process.env.MASTER_EXPIRY_DRY_RUN === "true" ||
    process.env.OWNER_ALERTS_DRY_RUN === "1";

  const candidates = findMastersNeedingExpiryReminder();
  let sent = 0;
  let skipped_no_email = 0;
  let skipped_dup = 0;
  let failed = 0;

  const billingUrl = `${appBaseUrl()}/app/billing`;

  for (const m of candidates) {
    const key = digestKey(m.id, m.days_left, m.ends_at);
    if (alreadyLogged(key)) {
      skipped_dup += 1;
      continue;
    }

    if (!m.notify_email) {
      skipped_no_email += 1;
      continue;
    }

    const label = m.kind === "trial" ? "Пробный период" : "Подписка";
    const subject = `МояЗапись: ${label.toLowerCase()} заканчивается через ${daysWord(m.days_left)}`;
    const text = [
      `Здравствуйте, ${m.name}!`,
      "",
      `${label} заканчивается через ${daysWord(m.days_left)} — ${formatRuDate(m.ends_at)}.`,
      "После этой даты онлайн-запись на вашей странице будет недоступна.",
      "",
      `Продлить: ${billingUrl}`,
      `Ваша страница: ${appBaseUrl()}/m/${m.slug}`,
      "",
      "— МояЗапись",
    ].join("\n");

    if (dryRun) {
      record(key, m.id, m.days_left);
      sent += 1;
      continue;
    }

    const ok = await sendPlainEmail(m.notify_email, subject, text);
    if (!ok) {
      failed += 1;
      continue;
    }
    record(key, m.id, m.days_left);
    sent += 1;
  }

  return {
    candidates: candidates.length,
    sent,
    skipped_no_email,
    skipped_dup,
    failed,
  };
}
