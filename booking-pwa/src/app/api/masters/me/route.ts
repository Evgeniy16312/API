import { NextResponse } from "next/server";
import { requireAuth, rowToMaster } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  return NextResponse.json(master);
}

export async function PATCH(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowed = [
      "name",
      "phone",
      "specialty",
      "address",
      "description",
      "avatar_url",
      "max_user_id",
      "vk_user_id",
      "work_schedule",
      "slot_duration",
    ] as const;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(
          key === "work_schedule" ? JSON.stringify(body[key]) : body[key]
        );
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
    }

    values.push(master.id);
    getDb()
      .prepare(`UPDATE masters SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);

    const updated = getDb()
      .prepare("SELECT * FROM masters WHERE id = ?")
      .get(master.id) as Record<string, unknown>;

    return NextResponse.json(rowToMaster(updated));
  } catch (error) {
    console.error("Update master error:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
