import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { JsonLd } from "@/components/seo/json-ld";
import { Badge, CardSurface, Chip } from "@/components/ui";
import {
  buildHyroxDetailPath,
  HYROX_EQUIPMENT_LABELS,
  HYROX_POSITIVE_EVIDENCE_DISCLOSURE,
} from "@/lib/hyrox-discovery";
import { loadHyroxDiscoveryData } from "@/lib/hyrox-discovery-server";
import { buildCanonicalPath } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";

import styles from "./hyrox-detail.module.css";

type HyroxDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const loadHyroxLocation = cache(async (slug: string) => {
  const data = await loadHyroxDiscoveryData();
  return data.locations.find((location) => location.slug === slug) ?? null;
});

export const revalidate = 3600;

export async function generateMetadata({ params }: HyroxDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await loadHyroxLocation(slug);

  if (!location) {
    return {
      title: "HYROX施設が見つかりません",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pathname = buildHyroxDetailPath(location.slug);
  const title = `${location.name} — HYROX Official Training Club`;
  const description = location.confirmedEquipment.length > 0
    ? `${location.prefecture}${location.city}にある${location.name}のHYROX施設情報です。公式情報で確認できた設備と施設公式サイトを確認できます。`
    : `${location.prefecture}${location.city}にある${location.name}のHYROX Official Training Club情報です。所在地と施設公式サイトを確認できます。`;

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${title} | GymMap`,
      description,
      url: buildCanonicalPath(pathname),
      locale: "ja_JP",
      type: "article",
    },
  };
}

export default async function HyroxDetailPage({ params }: HyroxDetailPageProps) {
  const { slug } = await params;
  const location = await loadHyroxLocation(slug);

  if (!location) {
    notFound();
  }

  const pathname = buildHyroxDetailPath(location.slug);
  const selectedMapPath = `/training/hyrox?selected=${encodeURIComponent(location.slug)}#hyrox-map-heading`;
  const locationJsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    "@id": `${buildCanonicalPath(pathname)}#health-club`,
    name: location.name,
    description: `${location.name}のHYROX Official Training Club情報ページ`,
    url: buildCanonicalPath(pathname),
    sameAs: location.officialUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: location.prefecture,
      addressLocality: location.city,
      streetAddress: location.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.latitude,
      longitude: location.longitude,
    },
    parentOrganization: {
      "@type": "Organization",
      name: location.brandName,
    },
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "GymMap", path: "/" },
    { name: "HYROX", path: "/training/hyrox" },
    { name: location.name, path: pathname },
  ]);

  return (
    <div className={`page-stack hyrox-page ${styles.page}`}>
      <JsonLd data={[locationJsonLd, breadcrumbJsonLd]} />
      <nav className={`hyrox-breadcrumb ${styles.breadcrumb}`} aria-label="パンくずリスト">
        <Link href="/training/hyrox">HYROX</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">施設詳細</span>
      </nav>

      <CardSurface as="section" className={styles.hero} aria-labelledby="hyrox-detail-heading">
        <div className={styles.identity}>
          <Badge tone="accent">Official Training Club</Badge>
          <p className={styles.brand}>{location.brandName}</p>
          <h1 id="hyrox-detail-heading">{location.name}</h1>
          <p className={styles.area}>
            {location.prefecture} {location.city}
          </p>
          <p className={styles.address}>{location.address}</p>
        </div>

        <div className={styles.actions} aria-label="HYROX施設の関連リンク">
          <Link className={styles.primaryAction} href={selectedMapPath}>
            地図で確認する
          </Link>
          <Link href="/training/hyrox">HYROXの施設一覧に戻る</Link>
          {location.officialUrl ? (
            <a
              href={location.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${location.name}の公式サイトを新しいタブで開く`}
            >
              施設公式サイト ↗
            </a>
          ) : null}
        </div>
      </CardSurface>

      {location.confirmedEquipment.length > 0 ? (
        <CardSurface
          as="section"
          className={styles.equipment}
          aria-labelledby="hyrox-detail-equipment-heading"
        >
          <div className={styles.sectionHeading}>
            <p>POSITIVE EVIDENCE</p>
            <h2 id="hyrox-detail-equipment-heading">公式情報で確認できた設備</h2>
          </div>
          <div className={styles.equipmentChips}>
            {location.confirmedEquipment.map((equipment) => (
              <Chip key={equipment} tone="positive">
                {HYROX_EQUIPMENT_LABELS[equipment]}
              </Chip>
            ))}
          </div>
          <p className={styles.disclosure}>{HYROX_POSITIVE_EVIDENCE_DISCLOSURE}</p>
        </CardSurface>
      ) : null}
    </div>
  );
}
