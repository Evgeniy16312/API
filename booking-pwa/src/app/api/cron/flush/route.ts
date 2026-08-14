import { flushOutbox } from "@/lib/outbox";
import { jsonError, jsonOk } from "@/lib/http";
import { processMasterExpiryReminders } from "@/lib/master-expiry-alerts";
import { processOwnerSubscriptionAlerts } from "@/lib/owner-alerts";
import { syncAllMasterSubscriptions } from "@/lib/subscription";

/** Cron: outbox + subscription sync + owner/master expiry alerts. */
export async function POST(request: Request) {
  const key =
    request.headers.get("x-admin-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected =
    process.env.CRON_SECRET || process.env.ADMIN_SETUP_KEY || "";

  if (!expected || key !== expected) {
    return jsonError("Forbidden", 403);
  }

  const outbox = await flushOutbox(50);
  const subscriptions = syncAllMasterSubscriptions(200);
  const owner_alerts = await processOwnerSubscriptionAlerts();
  const master_expiry_alerts = await processMasterExpiryReminders();
  return jsonOk({
    outbox,
    subscriptions,
    owner_alerts,
    master_expiry_alerts,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
