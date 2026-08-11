import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getMasterBySlug } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { notifyMaster } from "@/lib/notifications";
import { formatBookingDate, isValidPhone } from "@/lib/slots";
import type { Booking, Service } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, service_id, client_name, client_phone, date, time } = body;

    if (!slug || !service_id || !client_name || !client_phone || !date || !time) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    if (!isValidPhone(client_phone)) {
      return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
    }

    const master = getMasterBySlug(slug);
    if (!master) {
      return NextResponse.json({ error: "Мастер не найден" }, { status: 404 });
    }

    const service = getDb()
      .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
      .get(service_id, master.id) as Service | undefined;

    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    const conflict = getDb()
      .prepare(
        "SELECT id FROM bookings WHERE master_id = ? AND date = ? AND time = ? AND status != 'cancelled'"
      )
      .get(master.id, date, time);

    if (conflict) {
      return NextResponse.json(
        { error: "Это время уже занято, выберите другое" },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    getDb()
      .prepare(
        `INSERT INTO bookings (id, master_id, service_id, service_name, client_name, client_phone, date, time, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
      )
      .run(
        id,
        master.id,
        service.id,
        service.name,
        client_name.trim(),
        client_phone.trim(),
        date,
        time,
        now
      );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const formattedDate = formatBookingDate(date, time);

    await notifyMaster(master.max_user_id, master.vk_user_id, {
      masterName: master.name,
      clientName: client_name.trim(),
      clientPhone: client_phone.trim(),
      serviceName: service.name,
      date: formattedDate.split(",")[0],
      time,
      pageUrl: `${baseUrl}/m/${master.slug}`,
    });

    return NextResponse.json({ id, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Ошибка записи" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { requireAuth } = await import("@/lib/auth");
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = "SELECT * FROM bookings WHERE master_id = ?";
  const params: (string | number)[] = [master.id];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY date DESC, time DESC";

  const bookings = getDb().prepare(query).all(...params) as unknown as Booking[];
  return NextResponse.json(bookings);
}
