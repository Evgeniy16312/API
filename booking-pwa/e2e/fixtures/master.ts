export type MasterInput = {
  name: string;
  phone: string;
  slug: string;
  specialty: string;
  email: string;
  password: string;
};

/** Unique master payload for each test run — avoids slug conflicts. */
export function makeMaster(overrides: Partial<MasterInput> = {}): MasterInput {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return {
    name: `Тест Мастер ${suffix}`,
    phone: "+79991234567",
    slug: `t${suffix}`.slice(0, 20).toLowerCase(),
    specialty: "Барбер",
    email: `test+${suffix}@example.com`,
    password: "TestPass1",
    ...overrides,
  };
}
