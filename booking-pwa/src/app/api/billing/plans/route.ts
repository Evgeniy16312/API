import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import { listBillingPlans } from "@/lib/billing";

export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);
  return jsonOk({ plans: listBillingPlans() });
}
