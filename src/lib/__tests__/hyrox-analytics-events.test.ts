import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import { isValidElement, type ReactElement, type ReactNode } from "react";

import { HyroxFacilityCard } from "@/components/training/hyrox-facility-card";
import { HyroxOfficialSiteLink } from "@/components/training/hyrox-official-site-link";
import type { HyroxDiscoveryLocation } from "@/lib/hyrox-discovery";
import {
  trackHyroxAreaSelect,
  trackHyroxCurrentLocationUse,
  trackHyroxExternalLinkClick,
  trackHyroxFacilitySelect,
} from "@/lib/hyrox-analytics";

type GtagCall = ["event", string, Record<string, string | number>];
type UiElement = ReactElement<Record<string, unknown>>;

const require = createRequire(import.meta.url);

function loadMapSelectionContent() {
  const source = fs.readFileSync(
    "src/components/training/hyrox-map-selection-content.tsx",
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const componentModule = {
    exports: {} as {
      HyroxMapSelectionContent: (props: {
        location: HyroxDiscoveryLocation;
        outsideCurrentResults: boolean;
        resultCount: number;
      }) => ReactElement;
    },
  };
  vm.runInNewContext(compiled, {
    exports: componentModule.exports,
    require(id: string) {
      if (id === "react/jsx-runtime") return require(id);
      if (id.endsWith("hyrox-analytics")) return { trackHyroxFacilitySelect };
      if (id.endsWith("hyrox-discovery")) {
        return {
          buildHyroxDetailPath: (slug: string) => `/training/hyrox/${slug}`,
          HYROX_EQUIPMENT_LABELS: {},
        };
      }
      if (id.endsWith("hyrox-official-site-link")) {
        return { HyroxOfficialSiteLink: "HyroxOfficialSiteLink" };
      }
      if (id.endsWith("/ui")) return { Badge: "Badge", Chip: "Chip" };
      if (id.endsWith(".css")) return { __esModule: true, default: {} };
      if (id === "next/link") return { __esModule: true, default: "Link" };
      return {};
    },
  });
  return componentModule.exports.HyroxMapSelectionContent;
}

const location: HyroxDiscoveryLocation = {
  id: "facility-123",
  slug: "example-hyrox-club",
  name: "Example HYROX Club",
  brandId: "brand-1",
  brandName: "Example Brand",
  prefecture: "東京都",
  city: "渋谷区",
  address: "東京都渋谷区1-1-1",
  latitude: 35.6,
  longitude: 139.7,
  official: true,
  officialUrl: "https://example.com/official?campaign=private",
  lastConfirmedAt: "2026-08-30T00:00:00.000Z",
  confirmedEquipment: [],
};

function withGtag(run: (calls: GtagCall[]) => void) {
  const calls: GtagCall[] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { origin: "https://gymmap.example" },
      gtag: (...args: GtagCall) => calls.push(args),
    },
  });

  try {
    run(calls);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
}

function descendants(node: ReactNode): UiElement[] {
  if (Array.isArray(node)) {
    return node.flatMap(descendants);
  }
  if (!isValidElement<Record<string, unknown>>(node)) {
    return [];
  }

  return [node, ...descendants(node.props.children as ReactNode)];
}

test("typed HYROX helpers dispatch only the four exact event families and allowlisted payloads", () => {
  withGtag((calls) => {
    trackHyroxAreaSelect({ area_type: "prefecture", area_id: "all", result_count: 12 });
    trackHyroxFacilitySelect({
      facility_id: "facility-123",
      source: "map_marker",
      action: "focus_map",
      result_count: 12,
    });
    trackHyroxCurrentLocationUse({ action_type: "request", result_count: 12 });
    trackHyroxExternalLinkClick({
      facility_id: "facility-123",
      destination_type: "facility_official_site",
      source: "facility_detail",
    });

    assert.deepEqual(calls, [
      ["event", "hyrox_area_select", { area_type: "prefecture", area_id: "all", result_count: 12 }],
      ["event", "hyrox_facility_select", { facility_id: "facility-123", source: "map_marker", action: "focus_map", result_count: 12 }],
      ["event", "hyrox_current_location_use", { action_type: "request", result_count: 12 }],
      ["event", "hyrox_external_link_click", { facility_id: "facility-123", destination_type: "facility_official_site", source: "facility_detail" }],
    ]);
  });
});

test("facility-card detail click emits one open_detail event with numeric list context", () => {
  withGtag((calls) => {
    const tree = HyroxFacilityCard({
      location,
      listPosition: 4,
      onMapFocus() {},
      resultCount: 12,
    });
    assert.equal(calls.length, 0, "render emits no analytics");
    const detailLink = descendants(tree).find(
      (node) => node.props.href === "/training/hyrox/example-hyrox-club",
    );
    assert.ok(detailLink);

    (detailLink.props.onClick as () => void)();
    assert.deepEqual(calls, [
      [
        "event",
        "hyrox_facility_select",
        {
          facility_id: "facility-123",
          source: "facility_card",
          action: "open_detail",
          list_position: 4,
          result_count: 12,
        },
      ],
    ]);
  });
});

test("map-selection duplicate trees emit only from the clicked detail control", () => {
  withGtag((calls) => {
    const HyroxMapSelectionContent = loadMapSelectionContent();
    const mobileTree = HyroxMapSelectionContent({
      location,
      outsideCurrentResults: false,
      resultCount: 8,
    });
    const desktopTree = HyroxMapSelectionContent({
      location,
      outsideCurrentResults: false,
      resultCount: 8,
    });
    assert.equal(calls.length, 0, "both responsive renders emit nothing");

    const mobileDetail = descendants(mobileTree).find(
      (node) => node.props.href === "/training/hyrox/example-hyrox-club",
    );
    const desktopDetail = descendants(desktopTree).find(
      (node) => node.props.href === "/training/hyrox/example-hyrox-club",
    );
    assert.ok(mobileDetail);
    assert.ok(desktopDetail);

    (mobileDetail.props.onClick as () => void)();
    assert.deepEqual(calls, [
      [
        "event",
        "hyrox_facility_select",
        {
          facility_id: "facility-123",
          source: "map_selection",
          action: "open_detail",
          result_count: 8,
        },
      ],
    ]);
  });
});

test("official-site clicks use controlled sources and never dispatch the URL", () => {
  withGtag((calls) => {
    for (const source of ["facility_card", "map_selection", "facility_detail"] as const) {
      const anchor = HyroxOfficialSiteLink({
        facilityId: location.id,
        href: location.officialUrl!,
        label: "official site",
        source,
      });
      assert.equal(calls.length, ["facility_card", "map_selection", "facility_detail"].indexOf(source));
      (anchor.props.onClick as () => void)();
    }

    assert.deepEqual(calls, [
      ["event", "hyrox_external_link_click", { facility_id: "facility-123", destination_type: "facility_official_site", source: "facility_card" }],
      ["event", "hyrox_external_link_click", { facility_id: "facility-123", destination_type: "facility_official_site", source: "map_selection" }],
      ["event", "hyrox_external_link_click", { facility_id: "facility-123", destination_type: "facility_official_site", source: "facility_detail" }],
    ]);
    assert.doesNotMatch(JSON.stringify(calls), /https?:|campaign=|Example HYROX Club/);
  });
});

test("forbidden HYROX events are absent from production source", () => {
  const forbidden = [
    "hyrox_page_view",
    "hyrox_facility_detail_view",
    "hyrox_map_open",
    "hyrox_marker_select",
    "hyrox_equipment_select",
    "hyrox_capability_select",
    "hyrox_no_results",
  ];
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") visit(entryPath);
      } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
        files.push(entryPath);
      }
    }
  };
  visit("src");
  const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");

  for (const eventName of forbidden) {
    assert.doesNotMatch(source, new RegExp(`['\"]${eventName}['\"]`));
  }
});
