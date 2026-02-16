import ItemsApp from "@/components/ItemsApp";

export const metadata = {
  title: "採購清單 | Furniture Purchase Web",
};

export default function ItemsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ItemsApp />
    </main>
  );
}
