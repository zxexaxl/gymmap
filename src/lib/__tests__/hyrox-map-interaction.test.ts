import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import * as discovery from "@/lib/hyrox-discovery";
import * as selection from "@/components/map/map-runtime-state";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../components/training/hyrox-discovery.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

type Node = { type: string; props: Record<string, unknown> & { children?: Node | Node[] } };
type Action = (...args: unknown[]) => void;
type AnalyticsEvent = { name: string; parameters: Record<string, unknown> };

// Execute the actual component and its event callbacks with deterministic hooks.
// Browser layout/scroll measurements are a separate exact-Preview review gate.
function harness(initialSearch = "") {
  const states: unknown[] = [];
  let cursor = 0;
  const effects: (() => void)[] = [];
  const events = new Map<string, () => void>();
  const scrolls: string[] = [];
  const focuses: string[] = [];
  const history: string[] = [];
  const analytics: AnalyticsEvent[] = [];
  let geolocationSuccess: ((position: { coords: { latitude: number; longitude: number } }) => void) | undefined;
  let geolocationError: ((error: { code: number; PERMISSION_DENIED: number }) => void) | undefined;
  const location = new URL(`https://example.com/training/hyrox${initialSearch}`);
  const locations = ["first", "second"].map((id, index) => ({
    id, slug: `${id}-club`, name: id, brandName: "Club", prefecture: index === 0 ? "東京都" : "神奈川県",
    city: "東京", latitude: 35.6, longitude: 139.7, confirmedEquipment: [],
  }));
  const componentModule = { exports: {} as { HyroxDiscovery: (props: unknown) => Node } };
  const updateUrl = (_state: unknown, _title: string, href: string) => {
    location.href = new URL(href, location).href;
    history.push(href);
  };
  vm.runInNewContext(compiled, {
    exports: componentModule.exports,
    require(id: string) {
      if (id === "react") return {
        useState(initial: unknown) {
          const index = cursor++;
          if (!(index in states)) states[index] = initial;
          return [states[index], (value: unknown) => {
            states[index] = typeof value === "function" ? value(states[index]) : value;
          }];
        },
        useMemo: (factory: () => unknown) => factory(),
        useCallback: (callback: Action) => callback,
        useEffect: (effect: () => void) => effects.push(effect),
      };
      if (id === "react/jsx-runtime") return require(id);
      if (id === "next/dynamic") return { __esModule: true, default: () => "Map" };
      if (id.endsWith("hyrox-discovery")) return discovery;
      if (id.endsWith("analytics/events")) return {
        trackAreaSelect: (parameters: Record<string, unknown>) =>
          analytics.push({ name: "area_select", parameters: { ...parameters } }),
        trackCurrentLocationUse: (parameters: Record<string, unknown>) =>
          analytics.push({ name: "current_location_use", parameters: { ...parameters } }),
        trackFacilitySelect: (parameters: Record<string, unknown>) =>
          analytics.push({
            name: "facility_select",
            parameters: Object.fromEntries(
              Object.entries(parameters).filter(([, value]) => value !== undefined),
            ),
          }),
      };
      if (id.endsWith("map-runtime-state")) return selection;
      if (id.endsWith("map-provider")) return { configuredMapProvider: "osm" };
      if (id.endsWith(".css")) return { __esModule: true, default: {} };
      return new Proxy({}, { get: (_target, key) => key });
    },
    window: {
      location, history: { pushState: updateUrl, replaceState: updateUrl },
      matchMedia: () => ({ matches: false }),
      addEventListener: (name: string, callback: () => void) => events.set(name, callback),
      removeEventListener: () => {},
    },
    document: { getElementById: (id: string) => ({
      scrollIntoView: () => scrolls.push(id), focus: () => focuses.push(id),
    }) },
    navigator: {
      geolocation: {
        getCurrentPosition(
          success: typeof geolocationSuccess,
          error: typeof geolocationError,
        ) {
          geolocationSuccess = success;
          geolocationError = error;
        },
      },
    },
    requestAnimationFrame: (callback: () => void) => callback(),
    queueMicrotask: (callback: () => void) => callback(),
  });
  function render() {
    cursor = 0;
    effects.length = 0;
    const tree = componentModule.exports.HyroxDiscovery({ locations });
    const nodes: Node[] = [];
    function visit(node: Node | Node[] | undefined) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== "object") return;
      nodes.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return {
      map: nodes.find((node) => node.type === "Map")!,
      surfaces: nodes.filter((node) => node.type === "MapSelectionSurface"),
      details: nodes.filter((node) => node.type === "HyroxMapSelectionContent"),
      cards: nodes.filter((node) => node.type === "article"),
      fullCards: nodes.filter((node) => node.type === "HyroxFacilityCard"),
      select: nodes.find((node) => node.type === "select")!,
      currentLocation: nodes.find((node) => node.type === "CurrentLocationControl")!,
    };
  }
  return {
    render,
    scrolls,
    focuses,
    history,
    location,
    effects,
    events,
    analytics,
    geolocationSuccess: () => geolocationSuccess,
    geolocationError: () => geolocationError,
  };
}

function act(node: Node, event: string, ...args: unknown[]) {
  (node.props[event] as Action)(...args);
}

test("marker, second marker and close update detail/URL without revealing or focusing list cards", () => {
  const h = harness();
  let view = h.render();
  assert.equal(view.surfaces.length, 0);
  for (const id of ["first", "second"]) {
    act(view.map, "onSelectLocation", id);
    view = h.render();
    assert.equal(view.map.props.selectedLocationId, id);
    assert.equal(view.surfaces.length, 2);
    assert.equal((view.details[0].props.location as { id: string }).id, id);
    assert.equal(h.location.searchParams.get("selected"), `${id}-club`);
    assert.deepEqual(h.scrolls, []);
    assert.deepEqual(h.focuses, []);
    assert.equal(view.cards.find((card) => card.props.id === `hyrox-map-list-${id}`)?.props["aria-pressed"], true);
  }
  assert.deepEqual(h.analytics, [
    {
      name: "facility_select",
      parameters: { context: "hyrox", facility_id: "first", source: "map_marker", action: "focus_map", result_count: 2 },
    },
    {
      name: "facility_select",
      parameters: { context: "hyrox", facility_id: "second", source: "map_marker", action: "focus_map", result_count: 2 },
    },
  ]);

  act(view.map, "onSelectLocation", "second");
  assert.equal(h.analytics.length, 2, "same selected marker is not a new focus intent");
  act(view.surfaces[0], "onClose");
  view = h.render();
  assert.equal(view.map.props.selectedLocationId, null);
  assert.equal(view.surfaces.length, 0);
  assert.equal(h.location.search, "");
  assert.equal(h.history.length, 3);
  assert.deepEqual(h.scrolls, []);
  assert.deepEqual(h.focuses, []);
  assert.equal(h.analytics.length, 2, "close does not emit analytics");
});

test("compact list and full-card map actions preserve their distinct reveal behavior", () => {
  const h = harness();
  act(h.render().cards[0], "onClick");
  assert.equal(h.render().map.props.selectedLocationId, "first");
  assert.deepEqual(h.analytics[0], {
    name: "facility_select",
    parameters: { context: "hyrox", facility_id: "first", source: "map_list", action: "focus_map", list_position: 1, result_count: 2 },
  });
  assert.deepEqual(h.scrolls, []);
  act(h.render().fullCards[1], "onMapFocus", "second");
  assert.equal(h.render().map.props.selectedLocationId, "second");
  assert.deepEqual(h.analytics[1], {
    name: "facility_select",
    parameters: { context: "hyrox", facility_id: "second", source: "facility_card", action: "focus_map", list_position: 2, result_count: 2 },
  });
  assert.deepEqual(h.scrolls, ["hyrox-map-list-second", "hyrox-map-heading"]);
  assert.deepEqual(h.focuses, []);
});

test("area analytics fires only for real changes and uses stable all semantics", () => {
  const h = harness();
  let view = h.render();
  assert.equal(h.analytics.length, 0, "initial render emits nothing");

  act(view.select, "onChange", { target: { value: "東京都" } });
  view = h.render();
  assert.deepEqual(h.analytics[0], {
    name: "area_select",
    parameters: { context: "hyrox", area_type: "prefecture", area_id: "東京都", result_count: 1 },
  });

  act(view.select, "onChange", { target: { value: "東京都" } });
  assert.equal(h.analytics.length, 1, "same effective selection emits nothing");

  act(view.select, "onChange", { target: { value: "" } });
  assert.deepEqual(h.analytics[1], {
    name: "area_select",
    parameters: { context: "hyrox", area_type: "prefecture", area_id: "all", result_count: 2 },
  });
});

test("current-location clicks emit request/recenter but callbacks emit nothing", () => {
  const h = harness();
  let view = h.render();
  act(view.currentLocation, "onClick");
  assert.deepEqual(h.analytics, [
    {
      name: "current_location_use",
      parameters: { context: "hyrox", action_type: "request", result_count: 2 },
    },
  ]);

  h.geolocationSuccess()!({ coords: { latitude: 35.68, longitude: 139.76 } });
  assert.equal(h.analytics.length, 1, "geolocation success callback emits nothing");
  view = h.render();
  act(view.currentLocation, "onClick");
  assert.deepEqual(h.analytics[1], {
    name: "current_location_use",
    parameters: { context: "hyrox", action_type: "recenter", result_count: 2 },
  });
  assert.doesNotMatch(JSON.stringify(h.analytics), /latitude|longitude|coordinates|\"lat\"|\"lng\"/i);
});

test("geolocation errors and automatic map synchronization emit no additional events", () => {
  const h = harness();
  const view = h.render();
  act(view.currentLocation, "onClick");
  h.geolocationError()!({ code: 1, PERMISSION_DENIED: 1 });
  assert.equal(h.analytics.length, 1);
  act(view.map, "onProviderError");
  h.render();
  assert.equal(h.analytics.length, 1);
});

test("deep-link restoration retains selection authority without list reveal", () => {
  const h = harness("?selected=second-club");
  h.render();
  h.effects.forEach((effect) => effect());
  assert.equal(h.render().map.props.selectedLocationId, "second");
  assert.equal(h.analytics.length, 0, "URL restoration emits no intent event");
  h.location.search = "?selected=first-club";
  h.events.get("popstate")!();
  assert.equal(h.render().map.props.selectedLocationId, "first");
  assert.equal(h.analytics.length, 0, "back/forward restoration emits no intent event");
  assert.deepEqual(h.scrolls, []);
  assert.deepEqual(h.focuses, []);
});
