import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-[#1a1a2e]">МояЗапись</span>
        <Link href="/app" className="text-sm text-[#c9a96e] font-medium">
          Войти →
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#c9a96e]/10 text-[#a88b4a] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            MAX + VK уведомления
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] leading-tight mb-4">
            Ваша страница
            <br />
            <span className="text-[#c9a96e]">с записью</span>
          </h1>
          <p className="text-[#6b7280] text-lg leading-relaxed">
            Портфолио, услуги и онлайн-запись в одной ссылке.
            Клиенты записываются сами — вы получаете уведомление в MAX или VK.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {[
            { icon: "📱", title: "Одна ссылка или QR-код", desc: "Добавьте в Instagram, VK или визитку" },
            { icon: "🖼️", title: "Портфолио работ", desc: "Клиенты видят ваши лучшие работы" },
            { icon: "📅", title: "Запись 24/7", desc: "Клиент выбирает услугу, дату и время" },
            { icon: "🔔", title: "Уведомления в MAX и VK", desc: "Без Telegram и VPN" },
          ].map((item) => (
            <div key={item.title} className="card flex gap-4 items-start">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-[#1a1a2e]">{item.title}</h3>
                <p className="text-sm text-[#6b7280]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link href="/app/register" className="btn-primary block text-center w-full text-lg py-4">
            Создать страницу бесплатно
          </Link>
          <p className="text-center text-sm text-[#6b7280]">
            Настройка за 5 минут · Работает на iPhone и Android
          </p>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-sm text-[#6b7280] border-t border-[#e8e6e3]">
        МояЗапись © 2026
      </footer>
    </div>
  );
}
