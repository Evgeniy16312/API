import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { sendPlainEmail } from "@/lib/notifications";
import { TRIAL_DAYS } from "@/lib/subscription";

export const DEFAULT_OWNER_ALERT_WARN_DAYS = 3;

export type ExpiringMaster = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  ends_at: string;
  kind: "trial" | "paid";
};

function warnDays(): number {
  const raw = Number(process.env.OWNER_ALERT_WARN_DAYS || DEFAULT_OWNER_ALERT_WARN_DAYS);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_OWNER_ALERT_WARN_DAYS;
  return Math.min(30, Math.floor(raw));
}

function ownerNotifyEmail(): string {
  return (
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""
  );
}

function formatRuDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU");
}

function digestKey(masterId: string, endsAt: string): string {
  const day = endsAt.slice(0, 10);
  return `expiry:${masterId}:${day}`;
}

/**
 * Masters whose trial or paid_until ends within warnDays (inclusive of today).
 * Skips blocked / already past_due.
 */
export function findExpiringMasters(
  withinDays = warnDays(),
  now = new Date()
): ExpiringMaster[] {
  const horizon = new Date(now.getTime() + withinDays * 86400_000);
  const rows = getDb()
    .prepare(
      `SELECT id, name, slug, plan, subscription_status, paid_until, created_at, blocked
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
    plan: string;
    subscription_status: string;
    paid_until: string;
    created_at: string;
    blocked: number;
  }[];

  const out: ExpiringMaster[] = [];
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

    if (!ends) continue;
    if (ends < now) continue;
    if (ends > horizon) continue;

    out.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: row.plan,
      subscription_status: row.subscription_status,
      ends_at: ends.toISOString(),
      kind,
    });
  }

  return out;
}

function alreadyLogged(key: string): boolean {
  const row = getDb()
    .prepare("SELECT digest_key FROM owner_alert_log WHERE digest_key = ?")
    .get(key) as { digest_key: string } | undefined;
  return Boolean(row);
}

function recordAlert(master: ExpiringMaster): void {
  const key = digestKey(master.id, master.ends_at);
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO owner_alert_log (id, kind, digest_key, master_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      randomBytes(12).toString("hex"),
      `expiry_${master.kind}`,
      key,
      master.id,
      new Date().toISOString()
    );
}

function buildDigest(masters: ExpiringMaster[]): { subject: string; text: string } {
  const subject =
    masters.length === 1
      ? `МояЗапись: подписка скоро истекает — ${masters[0].name}`
      : `МояЗапись: ${masters.length} подписки истекают скоро`;

  const lines = [
    "Скоро закончится доступ у мастеров:",
    "",
    ...masters.map((m) => {
      const label = m.kind === "trial" ? "пробный период" : "оплата";
      return `• ${m.name} (/m/${m.slug}) — ${label} до ${formatRuDate(m.ends_at)} [${m.plan}/${m.subscription_status}]`;
    }),
    "",
    "Продлить: /admin → «+30 дней».",
  ];

  return { subject, text: lines.join("\n") };
}

export type OwnerAlertFlushResult = {
  candidates: number;
  new: number;
  sent: boolean;
  skipped?: "no_recipient" | "smtp_failed" | "none_new";
};

/**
 * Cron step: email owner once per master+expiry-day about upcoming end.
 * Dedup via owner_alert_log; only records after successful send (or dry-run).
 */
export async function processOwnerSubscriptionAlerts(
  options: { dryRun?: boolean; withinDays?: number } = {}
): Promise<OwnerAlertFlushResult> {
  const dryRun =
    options.dryRun === true ||
    process.env.OWNER_ALERTS_DRY_RUN === "1" ||
    process.env.OWNER_ALERTS_DRY_RUN === "true";

  const candidates = findExpiringMasters(options.withinDays);
  const fresh = candidates.filter(
    (m) => !alreadyLogged(digestKey(m.id, m.ends_at))
  );

  if (fresh.length === 0) {
    return {
      candidates: candidates.length,
      new: 0,
      sent: false,
      skipped: "none_new",
    };
  }

  if (dryRun) {
    for (const m of fresh) recordAlert(m);
    return { candidates: candidates.length, new: fresh.length, sent: true };
  }

  const to = ownerNotifyEmail();
  if (!to) {
    return {
      candidates: candidates.length,
      new: fresh.length,
      sent: false,
      skipped: "no_recipient",
    };
  }

  const { subject, text } = buildDigest(fresh);
  const ok = await sendPlainEmail(to, subject, text);
  if (!ok) {
    return {
      candidates: candidates.length,
      new: fresh.length,
      sent: false,
      skipped: "smtp_failed",
    };
  }

  for (const m of fresh) recordAlert(m);
  return { candidates: candidates.length, new: fresh.length, sent: true };
}
