import { sendGa4Event, type Ga4AnalyticsEvent } from "@/lib/analytics/ga4";

export type AnalyticsContext = Ga4AnalyticsEvent["parameters"]["context"];
export type FacilitySource =
  | "map_marker"
  | "map_list"
  | "facility_card"
  | "map_selection";
export type FacilityAction = "focus_map" | "open_detail";
export type ExternalLinkSource =
  | "facility_card"
  | "map_selection"
  | "facility_detail";

export function trackAreaSelect(parameters: {
  context: AnalyticsContext;
  area_type: "prefecture" | "municipality";
  area_id: string;
  result_count: number;
}) {
  sendGa4Event({ name: "area_select", parameters });
}

export function trackFacilitySelect(parameters: {
  context: AnalyticsContext;
  facility_id: string;
  source: FacilitySource;
  action: FacilityAction;
  list_position?: number;
  result_count?: number;
}) {
  sendGa4Event({
    name: "facility_select",
    parameters: {
      context: parameters.context,
      facility_id: parameters.facility_id,
      source: parameters.source,
      action: parameters.action,
      ...(parameters.list_position === undefined
        ? {}
        : { list_position: parameters.list_position }),
      ...(parameters.result_count === undefined
        ? {}
        : { result_count: parameters.result_count }),
    },
  });
}

export function trackCurrentLocationUse(parameters: {
  context: AnalyticsContext;
  action_type: "request" | "recenter";
  result_count?: number;
}) {
  sendGa4Event({
    name: "current_location_use",
    parameters: {
      context: parameters.context,
      action_type: parameters.action_type,
      ...(parameters.result_count === undefined
        ? {}
        : { result_count: parameters.result_count }),
    },
  });
}

export function trackExternalLinkClick(parameters: {
  context: AnalyticsContext;
  facility_id: string;
  destination_type: "facility_official_site";
  source: ExternalLinkSource;
}) {
  sendGa4Event({ name: "external_link_click", parameters });
}
