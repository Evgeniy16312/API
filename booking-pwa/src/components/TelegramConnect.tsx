"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";

interface ConnectData {
  connected: boolean;
  telegram_user_id: string;
  pending_code: string | null;
  code_expires_at: string | null;
}

export default function TelegramConnect() {
  const [status, setStatus] = useState<ConnectData | null>(null);
  const [code, setCode] = useState("");
  const [botUrl, setBotUrl] = useState("");
  const [connectCommand, setConnectCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch("/api/telegram/connect");
      setStatus(data);
      if (data.pending_code) {
        setCode(data.pending_code);
        setConnectCommand(`/connect ${data.pending_code}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!status?.pending_code || status.connected) return;
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, [status?.pending_code, status?.connected, loadStatus]);

  async function generateCode() {
    setGenerating(true);
    try {
      const data = await apiFetch("/api/telegram/connect", { method: "POST" });
      setCode(data.code);
      setBotUrl(data.bot_url);
      setConnectCommand(data.connect_command);
      await loadStatus();
    } finally {
      setGenerating(false);
    }
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(connectCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="h-20 animate-pulse bg-[#f4f0ea] rounded-xl" />;
  }

  if (status?.connected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-600 text-lg">✅</span>
          <span className="font-medium text-green-800">Telegram подключён</span>
        </div>
        <p className="text-sm text-green-700">
          ID: {status.telegram_user_id}
        </p>
        <button
          type="button"
          onClick={generateCode}
          className="text-sm text-green-700 underline mt-2"
        >
          Переподключить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="telegram-connect">
      {!code ? (
        <button
          type="button"
          onClick={generateCode}
          disabled={generating}
          className="btn-primary w-full text-sm"
          data-testid="telegram-connect-start"
        >
          {generating ? "Генерируем код..." : "Подключить Telegram"}
        </button>
      ) : (
        <div className="bg-[#f4f0ea] rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">Шаг 1. Откройте бота в Telegram</p>
          {botUrl && (
            <a
              href={botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent block text-center text-sm py-2"
            >
              Открыть бота
            </a>
          )}

          <p className="text-sm font-medium">Шаг 2. Отправьте боту команду</p>
          <div className="bg-white border border-[#e7e0d6] rounded-lg px-3 py-2 font-mono text-sm flex justify-between items-center gap-2">
            <span className="break-all">{connectCommand}</span>
            <button
              type="button"
              onClick={copyCommand}
              className="text-[#c4a574] text-xs font-sans shrink-0"
            >
              {copied ? "✓" : "Копировать"}
            </button>
          </div>

          <p className="text-xs text-[#78716c]">
            Код действует 15 минут. Страница обновится после подключения.
          </p>

          <button
            type="button"
            onClick={generateCode}
            className="text-sm text-[#c4a574]"
          >
            Получить новый код
          </button>
        </div>
      )}
    </div>
  );
}
