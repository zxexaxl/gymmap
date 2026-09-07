import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import { sendGa4PageView } from "@/lib/analytics/ga4";

const require = createRequire(import.meta.url);

test("page_view strips query and fragment before dispatch", () => {
  const calls: unknown[][] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { origin: "https://gymmap.example" },
      gtag: (...args: unknown[]) => calls.push(args),
    },
  });

  try {
    sendGa4PageView("/training/hyrox?selected=facility-123#map");
    assert.deepEqual(calls, [
      [
        "event",
        "page_view",
        { page_location: "https://gymmap.example/training/hyrox" },
      ],
    ]);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("App Router pageviews track pathname changes once and ignore query-only HYROX state", () => {
  const componentSource = fs.readFileSync(
    "src/components/analytics/ga4-page-view.tsx",
    "utf8",
  );
  const compiled = ts.transpileModule(componentSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const refs: Array<{ current: unknown }> = [];
  const pageviews: string[] = [];
  let cursor = 0;
  let pathname = "/training/hyrox";
  let pendingEffect: (() => void) | undefined;
  const componentModule = { exports: {} as { Ga4PageView: () => null } };

  vm.runInNewContext(compiled, {
    exports: componentModule.exports,
    require(id: string) {
      if (id === "react") {
        return {
          useEffect(effect: () => void) {
            pendingEffect = effect;
          },
          useRef(initial: unknown) {
            const index = cursor++;
            if (!(index in refs)) refs[index] = { current: initial };
            return refs[index];
          },
        };
      }
      if (id === "next/navigation") return { usePathname: () => pathname };
      if (id.endsWith("analytics/ga4")) {
        return { sendGa4PageView: (nextPathname: string) => pageviews.push(nextPathname) };
      }
      if (id === "react/jsx-runtime") return require(id);
      return {};
    },
  });

  const renderAndCommit = () => {
    cursor = 0;
    componentModule.exports.Ga4PageView();
    pendingEffect!();
  };

  renderAndCommit();
  pendingEffect!();
  assert.deepEqual(pageviews, ["/training/hyrox"], "Strict Mode effect replay is deduped");

  renderAndCommit();
  assert.deepEqual(pageviews, ["/training/hyrox"], "query-only pushState keeps the same pathname");

  pathname = "/training/hyrox/example-hyrox-club";
  renderAndCommit();
  assert.deepEqual(pageviews, ["/training/hyrox", "/training/hyrox/example-hyrox-club"]);

  pathname = "/training/hyrox";
  renderAndCommit();
  assert.deepEqual(pageviews, [
    "/training/hyrox",
    "/training/hyrox/example-hyrox-club",
    "/training/hyrox",
  ]);
});

test("layout uses one manual pageview strategy and production-only provider gates", () => {
  const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
  const pageViewComponent = fs.readFileSync(
    "src/components/analytics/ga4-page-view.tsx",
    "utf8",
  );

  assert.match(layout, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(layout, /process\.env\.VERCEL_ENV === "production"/);
  assert.match(layout, /send_page_view: false/);
  assert.match(layout, /<Ga4PageView \/>/);
  assert.doesNotMatch(layout, /cloudflareinsights|CLOUDFLARE_WEB_ANALYTICS/);
  assert.doesNotMatch(pageViewComponent, /useSearchParams|window\.location\.search|popstate/);
  assert.equal((`${layout}\n${pageViewComponent}`.match(/sendGa4PageView\(/g) ?? []).length, 1);
});
