"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRShareProps {
  url: string;
  slug: string;
}

export default function QRShare({ url }: QRShareProps) {
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
    <div className="card">
      <h3 className="font-semibold mb-1">Ваша ссылка для клиентов</h3>
      <p className="text-sm text-[#78716c] mb-3">
        Отправьте в мессенджер или покажите QR в салоне
      </p>

      <div className="flex gap-3 items-center mb-4">
        <div className="bg-white p-2 rounded-xl border border-[#e7e0d6] shrink-0">
          <QRCodeSVG value={url} size={88} level="M" />
        </div>
        <p className="font-mono text-xs break-all text-[#57534e] leading-relaxed">
          {url}
        </p>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={copyLink} className="btn-outline flex-1 text-sm">
          {copied ? "Скопировано" : "Копировать"}
        </button>
        <button type="button" onClick={shareLink} className="btn-primary flex-1 text-sm">
          Поделиться
        </button>
      </div>
    </div>
  );
}
