"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">管理者登入</h1>
        <p className="mt-2 text-sm text-slate-600">
          使用 Supabase Magic Link（Email OTP）。請輸入你的 Email 後收信點連結登入。
        </p>

        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <label className="text-xs text-slate-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="davidlin12tw@gmail.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          {sent ? (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
              已寄出登入連結，請到信箱點擊完成登入。
            </div>
          ) : null}

          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const e = email.trim();
                if (!e) throw new Error("請輸入 Email");

                const { error } = await supabase.auth.signInWithOtp({
                  email: e,
                  options: {
                    // back to items page after magic-link
                    emailRedirectTo:
                      typeof window !== "undefined"
                        ? `${window.location.origin}/items`
                        : undefined,
                  },
                });
                if (error) throw error;
                setSent(true);
              } catch (err: any) {
                setError(err?.message ?? String(err));
              } finally {
                setLoading(false);
              }
            }}
            className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "寄送中…" : "寄送 Magic Link"}
          </button>

          <p className="mt-3 text-xs text-slate-500">
            若收不到信：檢查垃圾郵件匣；或到 Supabase Auth 設定確認 Email OTP 已啟用。
          </p>
        </div>
      </div>
    </main>
  );
}
