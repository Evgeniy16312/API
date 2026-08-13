import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-[#1a1a2e]">МояЗапись</span>
        <Link href="/app/login" className="text-sm text-[#c9a96e] font-medium">
          Войти →
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#c9a96e]/10 text-[#a88b4a] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            Уведомления на почту
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] leading-tight mb-4">
            Ваша страница
            <br />
            <span className="text-[#c9a96e]">с записью</span>
          </h1>
          <p className="text-[#6b7280] text-lg leading-relaxed">
            Портфолио, услуги и онлайн-запись в одной ссылке. Клиенты
            записываются сами — вы получаете письмо о новой записи.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <Link
            href="/app/register"
            className="btn-primary block text-center w-full text-lg py-4"
          >
            Создать страницу бесплатно
          </Link>
          <p className="text-center text-sm text-[#6b7280]">
            После регистрации в кабинете появятся ваша ссылка и QR-код
          </p>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af] mb-3 px-1">
          Что получите
        </p>
        <div className="space-y-3 mb-10">
          {[
            {
              icon: "📱",
              title: "Ссылка и QR-код",
              desc: "В кабинете после регистрации — скопируйте или покажите клиенту",
            },
            {
              icon: "🖼️",
              title: "Портфолио работ",
              desc: "Клиенты видят ваши лучшие работы",
            },
            {
              icon: "📅",
              title: "Запись 24/7",
              desc: "Клиент выбирает услугу, дату и время",
            },
            {
              icon: "🔔",
              title: "Уведомления на почту",
              desc: "Письмо о новой записи на ваш Mail.ru или другой email",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#e8e6e3] bg-[#faf9f7] p-4 flex gap-4 items-start"
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <div>
                <h3 className="font-semibold text-[#1a1a2e]">{item.title}</h3>
                <p className="text-sm text-[#6b7280]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/app/login"
          className="btn-outline block text-center w-full"
        >
          Уже есть аккаунт? Войти
        </Link>
      </main>

      <footer className="px-6 py-6 text-center text-sm text-[#6b7280] border-t border-[#e8e6e3]">
        МояЗапись © 2026
      </footer>
    </div>
  );
}
