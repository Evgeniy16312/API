import Link from "next/link";

const STEPS = [
  {
    n: "1",
    t: "Создайте страницу",
    d: "Имя, услуги и график — всё на одной странице, быстро и просто",
  },
  {
    n: "2",
    t: "Поделитесь ссылкой",
    d: "QR, MAX, Telegram или почта — клиент получит, как ему привычнее",
  },
  {
    n: "3",
    t: "Принимайте записи",
    d: "Новая запись сразу в списке — время, услуга и контакт клиента",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-lg mx-auto bg-[#f4f0ea]">
      <section className="landing-hero shrink-0 rounded-b-[2rem] px-5 pb-8">
        <header className="pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 flex justify-between items-center">
          <span className="text-lg font-bold tracking-tight text-white">
            МояЗапись
          </span>
          <Link
            href="/app/login"
            className="text-sm font-semibold text-[#e8d4b0] min-h-11 inline-flex items-center"
          >
            Войти
          </Link>
        </header>

        <p className="landing-badge mb-5">С телефона · просто и быстро</p>

        <h1 className="text-[1.85rem] sm:text-[2.05rem] leading-[1.12] font-bold mb-3 text-white">
          Ваша страница для онлайн-записи.
        </h1>
        <p className="text-[1.05rem] leading-relaxed text-[#e8d4b0] font-medium mb-4">
          Клиенты сами выбирают время.
        </p>
        <p className="text-[#a8a29e] text-[0.95rem] leading-relaxed">
          Одна ссылка — услуги, портфолио и свободное время. О каждой новой
          записи сообщим тем способом, который вы настроите.
        </p>
      </section>

      <main className="flex-1 px-5 py-6 space-y-6">
        <ol className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="landing-step">
              <span className="landing-step-num">{s.n}</span>
              <div>
                <p className="font-semibold text-[#1c1917]">{s.t}</p>
                <p className="text-sm text-[#78716c] leading-snug mt-0.5">
                  {s.d}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="text-center text-sm text-[#78716c]">
          14 дней бесплатно · далее от 149 ₽ в месяц
        </p>
      </main>

      <footer className="shrink-0 px-5 pt-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Link href="/app/register" className="btn-primary landing-cta w-full">
          Попробовать 14 дней
        </Link>
      </footer>
    </div>
  );
}
