"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";

interface ConnectData {
  connected: boolean;
  max_user_id: string;
  pending_code: string | null;
  code_expires_at: string | null;
}

export default function MaxConnect() {
  const [status, setStatus] = useState<ConnectData | null>(null);
  const [code, setCode] = useState("");
  const [botUrl, setBotUrl] = useState("");
  const [connectCommand, setConnectCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch("/api/max/connect");
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
      const data = await apiFetch("/api/max/connect", { method: "POST" });
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
    return <div className="h-20 animate-pulse bg-[#faf9f7] rounded-xl" />;
  }

  if (status?.connected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-600 text-lg">✅</span>
          <span className="font-medium text-green-800">MAX подключён</span>
        </div>
        <p className="text-sm text-green-700">
          Уведомления приходят на ID: {status.max_user_id}
        </p>
        <button
          onClick={generateCode}
          className="text-sm text-green-700 underline mt-2"
        >
          Переподключить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!code ? (
        <button
          onClick={generateCode}
          disabled={generating}
          className="btn-primary w-full text-sm"
        >
          {generating ? "Генерируем код..." : "🔗 Подключить MAX"}
        </button>
      ) : (
        <div className="bg-[#faf9f7] rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">Шаг 1. Откройте бота в MAX</p>
          {botUrl && (
            <a
              href={botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent block text-center text-sm py-2"
            >
              Открыть бота в MAX
            </a>
          )}

          <p className="text-sm font-medium">Шаг 2. Отправьте боту команду</p>
          <div className="bg-white border border-[#e8e6e3] rounded-lg px-3 py-2 font-mono text-sm flex justify-between items-center">
            <span>{connectCommand}</span>
            <button onClick={copyCommand} className="text-[#c9a96e] text-xs font-sans">
              {copied ? "✓" : "Копировать"}
            </button>
          </div>

          <p className="text-xs text-[#6b7280]">
            Код действует 15 минут. Страница обновится автоматически после подключения.
          </p>

          <button onClick={generateCode} className="text-sm text-[#c9a96e]">
            Получить новый код
          </button>
        </div>
      )}
    </div>
  );
}
