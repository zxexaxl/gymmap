type Ga4EventParameters = Record<string, string | number>;

export type Ga4AnalyticsEvent =
  | {
      name: "area_select";
      parameters: {
        context: "gym" | "lesson" | "hyrox";
        area_type: "prefecture" | "municipality";
        area_id: string;
        result_count: number;
      };
    }
  | {
      name: "facility_select";
      parameters: {
        context: "gym" | "lesson" | "hyrox";
        facility_id: string;
        source: "map_marker" | "map_list" | "facility_card" | "map_selection";
        action: "focus_map" | "open_detail";
        list_position?: number;
        result_count?: number;
      };
    }
  | {
      name: "current_location_use";
      parameters: {
        context: "gym" | "lesson" | "hyrox";
        action_type: "request" | "recenter";
        result_count?: number;
      };
    }
  | {
      name: "external_link_click";
      parameters: {
        context: "gym" | "lesson" | "hyrox";
        facility_id: string;
        destination_type: "facility_official_site";
        source: "facility_card" | "map_selection" | "facility_detail";
      };
    };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "event", eventName: string, parameters: Ga4EventParameters) => void;
  }
}

function getCanonicalPageLocation() {
  return `${window.location.origin}${window.location.pathname || "/"}`;
}

export function sendGa4Event(event: Ga4AnalyticsEvent) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", event.name, {
    ...event.parameters,
    page_location: getCanonicalPageLocation(),
  });
}

export function sendGa4PageView(pathname: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const safePathname = pathname.split(/[?#]/, 1)[0] || "/";
  window.gtag("event", "page_view", {
    page_location: `${window.location.origin}${safePathname}`,
  });
}
