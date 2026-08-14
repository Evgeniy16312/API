import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <header className="px-5 py-4 flex justify-between items-center">
        <span className="text-lg font-bold tracking-tight">МояЗапись</span>
        <Link
          href="/app/login"
          className="text-sm font-semibold text-[#9a7b4a] min-h-11 inline-flex items-center"
        >
          Войти
        </Link>
      </header>

      <main className="flex-1 px-5 pt-2 pb-28">
        <p className="inline-flex items-center rounded-full bg-[#c4a574]/15 text-[#9a7b4a] px-3 py-1 text-xs font-semibold mb-4">
          Для мастеров с телефона
        </p>
        <h1 className="text-[2rem] leading-[1.15] font-bold mb-3">
          Клиенты записываются сами.
          <span className="block text-[#9a7b4a]">Вы только работаете.</span>
        </h1>
        <p className="text-[#78716c] text-[1.05rem] leading-relaxed mb-6">
          Одна ссылка: портфолио, цены и свободное время. Письмо о новой записи
          приходит на почту.
        </p>

        <ol className="space-y-3 mb-8">
          {[
            { n: "1", t: "Создайте страницу", d: "Имя, услуга, график — пара минут" },
            { n: "2", t: "Отправьте ссылку", d: "В WhatsApp, Telegram или как QR" },
            { n: "3", t: "Принимайте записи", d: "Подтвердите в кабинете одним тапом" },
          ].map((s) => (
            <li
              key={s.n}
              className="card flex gap-3 items-start py-3.5"
            >
              <span className="w-8 h-8 rounded-full bg-[#1c1917] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {s.n}
              </span>
              <div>
                <p className="font-semibold">{s.t}</p>
                <p className="text-sm text-[#78716c]">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="text-center text-sm text-[#78716c]">
          14 дней бесплатно · дальше от 149 ₽ / мес
        </p>
      </main>

      <div className="sticky-cta max-w-lg mx-auto w-full">
        <Link href="/app/register" className="btn-primary block text-center w-full">
          Создать страницу
        </Link>
      </div>
    </div>
  );
}
