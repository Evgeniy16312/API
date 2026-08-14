import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import {
  getBillingMode,
  getManualTransferInfo,
  listBillingPlans,
  paymentCommentForMaster,
} from "@/lib/billing";

export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);

  const mode = getBillingMode();
  const transfer = getManualTransferInfo();

  return jsonOk({
    mode,
    plans: listBillingPlans(),
    transfer:
      mode === "transfer"
        ? {
            ...transfer,
            comments: {
              basic: paymentCommentForMaster(master.slug, "basic"),
              pro: paymentCommentForMaster(master.slug, "pro"),
            },
          }
        : null,
  });
}
