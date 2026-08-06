import { buildCanonicalPath } from "@/lib/site";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type CollectionItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalPath(item.path),
    })),
  };
}

export function buildCollectionPageJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: CollectionItem[];
}) {
  const uniqueItems = Array.from(new Map(items.map((item) => [item.path, item])).values());

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: buildCanonicalPath(path),
    inLanguage: "ja-JP",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: uniqueItems.length,
      itemListElement: uniqueItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: buildCanonicalPath(item.path),
      })),
    },
  };
}
