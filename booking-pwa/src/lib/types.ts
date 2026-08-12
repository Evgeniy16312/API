export interface WorkDay {
  enabled: boolean;
  start: string;
  end: string;
}

export type WorkSchedule = Record<string, WorkDay>;

export interface Master {
  id: string;
  slug: string;
  name: string;
  phone: string;
  specialty: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string;
  avatar_url: string;
  max_user_id: string;
  vk_user_id: string;
  work_schedule: WorkSchedule;
  slot_duration: number;
  created_at: string;
}

export interface Service {
  id: string;
  master_id: string;
  name: string;
  duration: number;
  price: number;
  sort_order: number;
}

export interface PortfolioItem {
  id: string;
  master_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

export interface Booking {
  id: string;
  master_id: string;
  service_id: string;
  service_name: string;
  /** Duration in minutes at booking time (survives service edits). */
  service_duration?: number;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  /** Secret link for client cancel / manage. */
  manage_token?: string;
  created_at: string;
}

export interface Review {
  id: string;
  master_id: string;
  booking_id: string;
  client_name: string;
  rating: number;
  text: string;
  status: "published" | "hidden";
  created_at: string;
}

export const DEFAULT_SCHEDULE: WorkSchedule = {
  monday: { enabled: true, start: "10:00", end: "21:00" },
  tuesday: { enabled: true, start: "10:00", end: "21:00" },
  wednesday: { enabled: true, start: "10:00", end: "21:00" },
  thursday: { enabled: true, start: "10:00", end: "21:00" },
  friday: { enabled: true, start: "10:00", end: "21:00" },
  saturday: { enabled: true, start: "10:00", end: "19:00" },
  sunday: { enabled: false, start: "10:00", end: "19:00" },
};

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAY_LABELS: Record<string, string> = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
  saturday: "Суббота",
  sunday: "Воскресенье",
};
