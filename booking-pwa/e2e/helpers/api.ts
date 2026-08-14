import { APIRequestContext, expect } from "@playwright/test";
import type { MasterInput } from "../fixtures/master";
import { makeMaster } from "../fixtures/master";

export type RegisterResponse = {
  id: string;
  slug: string;
  token: string;
  name: string;
};

export type ServiceResponse = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

/** POST /api/masters/register — reusable for API and setup of later flows. */
export async function registerMaster(
  request: APIRequestContext,
  data: MasterInput
) {
  const response = await request.post("/api/masters/register", { data });
  const body = (await response.json()) as RegisterResponse & { error?: string };
  return { response, body };
}

export async function expectRegistered(
  request: APIRequestContext,
  data: MasterInput
): Promise<RegisterResponse> {
  const { response, body } = await registerMaster(request, data);
  expect(response.status(), body.error || "register failed").toBe(200);
  expect(body).toMatchObject({
    slug: data.slug,
    name: data.name,
    id: expect.any(String),
    token: expect.any(String),
  });
  return body;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Register master + create a default service for booking/slot tests. */
export async function seedMasterWithService(
  request: APIRequestContext,
  masterOverrides: Partial<MasterInput> = {},
  service: { name?: string; duration?: number; price?: number } = {}
) {
  const masterInput = makeMaster(masterOverrides);
  const master = await expectRegistered(request, masterInput);
  const headers = authHeaders(master.token);

  const res = await request.post("/api/services", {
    headers,
    data: {
      name: service.name ?? "Стрижка",
      duration: service.duration ?? 60,
      price: service.price ?? 1500,
    },
  });
  const body = (await res.json()) as ServiceResponse & { error?: string };
  expect(res.status(), body.error || "create service failed").toBe(201);

  return { master, masterInput, service: body, headers };
}

export function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  // skip Sunday if needed — DEFAULT_SCHEDULE has sunday disabled
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createPublicBooking(
  request: APIRequestContext,
  input: {
    slug: string;
    service_id: string;
    date?: string;
    time?: string;
    client_name?: string;
    client_phone?: string;
  }
) {
  const date = input.date ?? tomorrowDate();
  const time = input.time ?? "11:00";
  const response = await request.post("/api/bookings", {
    data: {
      slug: input.slug,
      service_id: input.service_id,
      client_name: input.client_name ?? "Клиент Тест",
      client_phone: input.client_phone ?? "+79991112233",
      date,
      time,
    },
  });
  const body = await response.json();
  return { response, body, date, time };
}
