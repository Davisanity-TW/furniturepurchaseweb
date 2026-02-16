import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            家具/家電採購清單
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            公開清單頁：可瀏覽、搜尋、篩選、排序；管理者登入後可新增/編輯。
          </p>
        </header>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-medium">入口</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/items"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              前往清單
            </Link>
            <Link
              href="/login"
              className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              管理者登入
            </Link>
            <a
              className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-slate-50"
              href="https://github.com/Davisanity-TW/Furniture_Purchase_Web/blob/main/docs/requirements.md"
              target="_blank"
              rel="noreferrer"
            >
              需求規格
            </a>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            目前若看不到資料，多半是 Supabase items table / RLS 尚未建立，或 Vercel env vars
            尚未設定。
          </div>
        </section>
      </div>
    </main>
  );
}
