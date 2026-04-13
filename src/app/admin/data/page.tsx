import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminDataTable } from "@/components/admin/data-table";
import { getAdminDataset } from "@/lib/data";

export const metadata: Metadata = {
  title: "Admin Data | GymMap MVP",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type AdminDataPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function AdminDataPage({ searchParams }: AdminDataPageProps) {
  const resolvedSearchParams = await searchParams;
  const expectedKey = process.env.ADMIN_ACCESS_KEY?.trim();
  const providedKey = getFirstValue(resolvedSearchParams.key).trim();

  if (expectedKey === undefined || expectedKey === "" || providedKey === "" || providedKey !== expectedKey) {
    notFound();
  }

  const dataset = await getAdminDataset();

  return (
    <div className="page-stack">
      <section className="panel">
        <h1>管理用データ確認</h1>
        <p className="muted">簡易保護された管理確認画面です。公開導線には載せず、管理キー一致時のみ表示します。</p>
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
