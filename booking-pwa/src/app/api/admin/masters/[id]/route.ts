import {
  deleteMasterAsAdmin,
  getMasterForAdmin,
  patchMasterAsAdmin,
} from "@/lib/admin";
import { jsonError, jsonOk, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  if (!requireAdmin(request)) {
    return jsonError("Forbidden", 403);
  }
  const { id } = await ctx.params;
  const master = getMasterForAdmin(id);
  if (!master) {
    return jsonError("Мастер не найден", 404);
  }
  return jsonOk(master);
}

export async function PATCH(request: Request, ctx: Ctx) {
  if (!requireAdmin(request)) {
    return jsonError("Forbidden", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const result = patchMasterAsAdmin(id, {
      notify_channel: body.notify_channel,
      notify_email: body.notify_email,
      plan: body.plan,
      subscription_status: body.subscription_status,
      paid_until: body.paid_until,
      blocked: body.blocked,
      extend_days: body.extend_days,
    });
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }
    return jsonOk(result.master);
  } catch (error) {
    console.error("Admin patch master error:", error);
    return jsonError("Ошибка обновления", 500);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  if (!requireAdmin(request)) {
    return jsonError("Forbidden", 403);
  }
  const { id } = await ctx.params;
  const result = deleteMasterAsAdmin(id);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }
  return jsonOk({ deleted: true, id });
}
