import { AdminDataTable } from "@/components/admin/data-table";
import { getAdminDataset } from "@/lib/data";

export default async function AdminDataPage() {
  const dataset = await getAdminDataset();

  return (
    <div className="page-stack">
      <section className="panel">
        <h1>管理用データ確認</h1>
        <p className="muted">認証なしの簡易確認画面です。一般導線からはリンクしない運用を想定しています。</p>
      </section>

      <AdminDataTable title="gym_brands" rows={dataset.gym_brands} />
      <AdminDataTable title="gym_locations" rows={dataset.gym_locations} />
      <AdminDataTable title="programs" rows={dataset.programs} />
      <AdminDataTable title="class_schedules" rows={dataset.class_schedules} />
      <AdminDataTable title="source_pages" rows={dataset.source_pages} />
      <AdminDataTable title="ingestion_runs" rows={dataset.ingestion_runs} />
      <AdminDataTable title="ingestion_items" rows={dataset.ingestion_items} />
    </div>
  );
}
