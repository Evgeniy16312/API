import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createVkConnectCode, getVkConnectStatus } from "@/lib/vk/connect";

export async function POST(request: Request) {
  const master = requireAuth(request);
  if (!master) return jsonError("Не авторизован", 401);

  const code = createVkConnectCode(master.id);
  return jsonOk({
    code,
    connect_command: `/connect ${code}`,
    expires_in_minutes: 15,
    hint: "Напишите команду сообществу VK (куда настроен Callback API)",
  });
}

export async function GET(request: Request) {
  const master = requireAuth(request);
  if (!master) return jsonError("Не авторизован", 401);
  return jsonOk(getVkConnectStatus(master.id));
}
