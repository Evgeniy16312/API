"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRShareProps {
  url: string;
  slug: string;
}

export default function QRShare({ url, slug }: QRShareProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: "Запись ко мне",
        text: "Запишитесь онлайн:",
        url,
      });
    } else {
      copyLink();
    }
  }

  return (
    <div className="card text-center">
      <h3 className="font-semibold mb-1">Ваша ссылка</h3>
      <p className="text-sm text-[#6b7280] mb-4">
        Отправьте клиентам или добавьте в соцсети
      </p>

      <div className="bg-white p-4 rounded-xl inline-block mb-4 border border-[#e8e6e3]">
        <QRCodeSVG value={url} size={160} level="M" />
      </div>

      <div className="bg-[#faf9f7] rounded-xl px-4 py-3 mb-4 font-mono text-sm break-all">
        /m/{slug}
      </div>

      <div className="flex gap-2">
        <button onClick={copyLink} className="btn-outline flex-1 text-sm">
          {copied ? "✓ Скопировано" : "Копировать"}
        </button>
        <button onClick={shareLink} className="btn-primary flex-1 text-sm">
          Поделиться
        </button>
      </div>
    </div>
  );
}
