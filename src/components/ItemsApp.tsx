"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, ItemStatus, Room } from "@/lib/types";
import { ADMIN_USER_ID, getSupabaseClient } from "@/lib/supabaseClient";

const ROOMS: Room[] = ["客廳", "廚房", "電腦房", "小房間", "主臥室", "浴室"];
const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "want", label: "想買" },
  { value: "candidate", label: "候選" },
  { value: "purchased", label: "已購買" },
  { value: "eliminated", label: "已淘汰" },
];

function statusLabel(s: ItemStatus) {
  return STATUSES.find((x) => x.value === s)?.label ?? s;
}

function fmtPrice(price: number | null, currency: string) {
  if (price == null) return "—";
  try {
    return new Intl.NumberFormat("zh-TW").format(price) + ` ${currency}`;
  } catch {
    return String(price);
  }
}

export default function ItemsApp() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filterRoom, setFilterRoom] = useState<Room | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [sortKey, setSortKey] = useState<"updated_at" | "price">("updated_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [userId, setUserId] = useState<string | null>(null);
  const isAdmin = userId === ADMIN_USER_ID;

  const [editing, setEditing] = useState<Item | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const supabase = useMemo(() => getSupabaseClient(), []);

  async function refresh() {
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError(
        "Missing Supabase env vars. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.",
      );
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order(sortKey, { ascending: sortDir === "asc" });

    if (error) {
      setError(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as Item[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) return;

    // session init
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortDir]);

  const categories = useMemo(() => {
    const set = new Set(
      items
        .map((i) => i.category)
        .filter(Boolean)
        .map((c) => c.trim())
        .filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (filterRoom === "all" ? true : i.room === filterRoom))
      .filter((i) => (filterStatus === "all" ? true : i.status === filterStatus))
      .filter((i) => (filterCategory ? i.category === filterCategory : true))
      .filter((i) => {
        if (!q) return true;
        const hay = `${i.name} ${i.brand ?? ""} ${i.model ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [items, query, filterRoom, filterStatus, filterCategory]);

  const grouped = useMemo(() => {
    const map = new Map<Room, Item[]>();
    for (const r of ROOMS) map.set(r, []);
    for (const i of filtered) {
      map.set(i.room, [...(map.get(i.room) ?? []), i]);
    }
    return map;
  }, [filtered]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function upsertItem(payload: Partial<Item> & { id?: string }) {
    if (!isAdmin) {
      alert("只有管理者可以編輯");
      return;
    }

    if (!supabase) return;
    const { error } = await supabase.from("items").upsert(payload).select();
    if (error) {
      alert(error.message);
      return;
    }
    setEditing(null);
    setIsCreating(false);
    await refresh();
  }

  async function deleteItem(id: string) {
    if (!isAdmin) return;
    if (!confirm("確定要刪除？")) return;
    if (!supabase) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">家具/家電採購清單</h1>
          <p className="mt-2 text-sm text-slate-600">
            公開可瀏覽；管理者登入後可新增/編輯/標記已購買。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userId ? (
            <>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {isAdmin ? "Admin" : "已登入"}
              </span>
              <button
                onClick={signOut}
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                登出
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              管理者登入
            </a>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setIsCreating(true);
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              新增
            </button>
          )}
        </div>
      </header>

      <section className="mb-6 grid gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="text-xs text-slate-600">搜尋（品名/品牌/型號）</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：冰箱 / Panasonic / NR-..."
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">空間</label>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value as any)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            {ROOMS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-600">狀態</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-600">類別</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">全部</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 lg:col-span-5">
          <div>
            <label className="text-xs text-slate-600">排序</label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="mt-1 rounded-md border px-3 py-2 text-sm"
            >
              <option value="updated_at">更新時間</option>
              <option value="price">價格</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600">方向</label>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
              className="mt-1 rounded-md border px-3 py-2 text-sm"
            >
              <option value="desc">新→舊 / 高→低</option>
              <option value="asc">舊→新 / 低→高</option>
            </select>
          </div>
          <button
            onClick={refresh}
            className="ml-auto rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            重新整理
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          讀取資料失敗：{error}
          <div className="mt-1 text-xs text-red-700">
            檢查：Supabase 環境變數是否已設定、items table/RLS policy 是否已建立。
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">載入中…</div>
      ) : (
        <div className="space-y-8">
          {ROOMS.map((room) => {
            const list = grouped.get(room) ?? [];
            return (
              <section key={room} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold">{room}</h2>
                  <span className="text-xs text-slate-500">{list.length} 項</span>
                </div>

                {list.length === 0 ? (
                  <div className="text-sm text-slate-500">（目前無項目）</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs text-slate-500">
                        <tr className="border-b">
                          <th className="py-2 pr-4">類別</th>
                          <th className="py-2 pr-4">品名</th>
                          <th className="py-2 pr-4">品牌/型號</th>
                          <th className="py-2 pr-4">價格</th>
                          <th className="py-2 pr-4">狀態</th>
                          <th className="py-2 pr-4">連結</th>
                          {isAdmin && <th className="py-2 pr-4">操作</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((i) => (
                          <tr key={i.id} className="border-b last:border-b-0">
                            <td className="py-2 pr-4 whitespace-nowrap text-slate-700">
                              {i.category}
                            </td>
                            <td className="py-2 pr-4 font-medium">{i.name}</td>
                            <td className="py-2 pr-4 text-slate-700">
                              {[i.brand, i.model].filter(Boolean).join(" ") || "—"}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap text-slate-700">
                              {fmtPrice(i.price, i.currency)}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                                {statusLabel(i.status)}
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              {i.url ? (
                                <a
                                  href={i.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  開啟
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            {isAdmin && (
                              <td className="py-2 pr-4 whitespace-nowrap">
                                <button
                                  className="mr-2 text-xs text-blue-700 hover:underline"
                                  onClick={() => {
                                    setIsCreating(false);
                                    setEditing(i);
                                  }}
                                >
                                  編輯
                                </button>
                                <button
                                  className="text-xs text-red-700 hover:underline"
                                  onClick={() => deleteItem(i.id)}
                                >
                                  刪除
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {(isCreating || editing) && isAdmin && (
        <EditDialog
          item={editing}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
          onSave={upsertItem}
        />
      )}

      <div className="mt-10 text-xs text-slate-500">
        Tips：如果你看到資料全空/報錯，通常是 items table/RLS 還沒建立，或 Vercel env vars 還沒設。
      </div>
    </div>
  );
}

function EditDialog({
  item,
  onClose,
  onSave,
}: {
  item: Item | null;
  onClose: () => void;
  onSave: (payload: Partial<Item> & { id?: string }) => void;
}) {
  const [form, setForm] = useState<Partial<Item>>(() =>
    item
      ? { ...item }
      : {
          name: "",
          category: "",
          room: "客廳" as Room,
          brand: "",
          model: "",
          price: null,
          currency: "TWD",
          url: "",
          note: "",
          status: "want" as ItemStatus,
        },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{item ? "編輯項目" : "新增項目"}</h3>
          <button
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
          >
            關閉
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="品名" required>
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>
          <Field label="類別" required>
            <input
              value={form.category ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="冰箱 / 洗衣機 / 冷氣 ..."
            />
          </Field>
          <Field label="空間" required>
            <select
              value={(form.room as any) ?? "客廳"}
              onChange={(e) => setForm((p) => ({ ...p, room: e.target.value as any }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="狀態" required>
            <select
              value={(form.status as any) ?? "want"}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="品牌">
            <input
              value={form.brand ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>
          <Field label="型號">
            <input
              value={form.model ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>

          <Field label="價格">
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  price: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>
          <Field label="幣別">
            <input
              value={form.currency ?? "TWD"}
              onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>

          <Field label="購買網址" className="sm:col-span-2">
            <input
              value={form.url ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </Field>

          <Field label="說明/備註" className="sm:col-span-2">
            <textarea
              value={form.note ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={4}
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (!form.name || !form.category || !form.room || !form.status) {
                alert("品名/類別/空間/狀態 為必填");
                return;
              }

              const payload: any = {
                id: item?.id,
                name: form.name,
                category: form.category,
                room: form.room,
                brand: form.brand || null,
                model: form.model || null,
                price: form.price ?? null,
                currency: form.currency || "TWD",
                url: form.url || null,
                note: form.note || null,
                status: form.status,
                purchased_at:
                  form.status === "purchased"
                    ? item?.purchased_at ?? new Date().toISOString()
                    : null,
              };

              onSave(payload);
            }}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-slate-600">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
