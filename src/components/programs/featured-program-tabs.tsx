"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { buildProgramPath } from "@/lib/site";

type FeaturedProgramItem = {
  kind: "program";
  id: string;
  slug: string;
  name: string;
  brand: string;
};

type FeaturedProgramShortcut = {
  kind: "shortcut";
  name: string;
  query: string;
  brand: string;
};

export type FeaturedProgramTab = {
  id: string;
  label: string;
  items: Array<FeaturedProgramItem | FeaturedProgramShortcut>;
};

export function FeaturedProgramTabs({ tabs }: { tabs: FeaturedProgramTab[] }) {
  const tabGroupId = useId();
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  if (!activeTab) return null;

  return (
    <div className="featured-program-browser">
      <div className="featured-program-tabs" role="tablist" aria-label="プログラムブランド">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              id={`${tabGroupId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tabGroupId}-${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.items.length}</small>
            </button>
          );
        })}
      </div>

      <div
        id={`${tabGroupId}-${activeTab.id}-panel`}
        className="featured-program-panel"
        role="tabpanel"
        aria-labelledby={`${tabGroupId}-${activeTab.id}-tab`}
      >
        <div className="program-card-grid">
          {activeTab.items.map((item) => (
            <article className={`program-card ${item.kind === "shortcut" ? "is-search-shortcut" : ""}`} key={`${item.kind}-${item.name}`}>
              <Link
                className="program-card-link"
                href={item.kind === "program" ? buildProgramPath(item.slug) : `/search?q=${encodeURIComponent(item.query)}`}
              >
                <span className="program-card-brand">{item.brand}</span>
                <strong>{item.name}</strong>
                <span className="program-card-arrow" aria-hidden="true">→</span>
              </Link>
              {item.kind === "program" ? (
                <FavoriteProgramButton id={item.id} slug={item.slug} name={item.name} iconOnly />
              ) : (
                <span className="program-card-search-badge">検索</span>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
