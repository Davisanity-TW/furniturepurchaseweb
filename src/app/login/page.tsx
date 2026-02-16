"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function makeClient(storage: Storage) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: true,
      storage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return makeClient(remember ? window.localStorage : window.sessionStorage);
  }, [remember]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">管理者登入</h1>
        <p className="mt-2 text-sm text-slate-600">
          使用 Email + 密碼登入。登入後可新增/編輯清單。
        </p>

        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <label className="text-xs text-slate-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="davidlin12tw@gmail.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            autoComplete="email"
          />

          <label className="mt-4 block text-xs text-slate-600">密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            autoComplete="current-password"
          />

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            記住我（下次不用再登入）
          </label>

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                if (!supabase)
                  throw new Error(
                    "Supabase env vars 未設定，請先設定 Vercel 環境變數並 redeploy",
                  );

                const e = email.trim();
                if (!e) throw new Error("請輸入 Email");
                if (!password) throw new Error("請輸入密碼");

                const { error } = await supabase.auth.signInWithPassword({
                  email: e,
                  password,
                });
                if (error) throw error;

                window.location.href = "/items";
              } catch (err: any) {
                setError(err?.message ?? String(err));
              } finally {
                setLoading(false);
              }
            }}
            className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "登入中…" : "登入"}
          </button>

          <p className="mt-3 text-xs text-slate-500">
            注意：Supabase 端需啟用「Email + Password」登入方式。
          </p>
        </div>
      </div>
    </main>
  );
}
