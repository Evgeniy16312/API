"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";

interface ConnectData {
  connected: boolean;
  vk_user_id: string;
  pending_code: string | null;
}

export default function VkConnect() {
  const [status, setStatus] = useState<ConnectData | null>(null);
  const [code, setCode] = useState("");
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch("/api/vk/connect");
      setStatus(data);
      if (data.pending_code) {
        setCode(data.pending_code);
        setCommand(`/connect ${data.pending_code}`);
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
      const data = await apiFetch("/api/vk/connect", { method: "POST" });
      setCode(data.code);
      setCommand(data.connect_command);
      await loadStatus();
    } finally {
      setGenerating(false);
    }
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="h-16 animate-pulse bg-[#f4f0ea] rounded-xl" />;
  }

  if (status?.connected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <p className="font-medium text-green-800 text-sm">VK подключён</p>
        <p className="text-xs text-green-700">ID: {status.vk_user_id}</p>
        <button onClick={generateCode} className="text-xs text-green-700 underline mt-1">
          Переподключить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!code ? (
        <button
          type="button"
          onClick={generateCode}
          disabled={generating}
          className="btn-outline w-full text-sm py-2"
        >
          {generating ? "Генерируем..." : "Подключить VK по коду"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#78716c]">
            Напишите сообществу VK (с Callback API) команду:
          </p>
          <div className="bg-white border border-[#e7e0d6] rounded-lg px-3 py-2 font-mono text-sm flex justify-between gap-2">
            <span>{command}</span>
            <button type="button" onClick={copyCommand} className="text-[#c4a574] text-xs">
              {copied ? "✓" : "Копировать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
