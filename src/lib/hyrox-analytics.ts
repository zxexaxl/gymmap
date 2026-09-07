import { sendGa4Event } from "@/lib/analytics/ga4";

export type HyroxFacilitySource =
  | "map_marker"
  | "map_list"
  | "facility_card"
  | "map_selection";

export type HyroxFacilityAction = "focus_map" | "open_detail";

export type HyroxExternalLinkSource =
  | "facility_card"
  | "map_selection"
  | "facility_detail";

export function trackHyroxAreaSelect(parameters: {
  area_type: "prefecture";
  area_id: string;
  result_count: number;
}) {
  sendGa4Event("hyrox_area_select", {
    area_type: parameters.area_type,
    area_id: parameters.area_id,
    result_count: parameters.result_count,
  });
}

export function trackHyroxFacilitySelect(parameters: {
  facility_id: string;
  source: HyroxFacilitySource;
  action: HyroxFacilityAction;
  list_position?: number;
  result_count: number;
}) {
  const payload = {
    facility_id: parameters.facility_id,
    source: parameters.source,
    action: parameters.action,
    ...(parameters.list_position === undefined
      ? {}
      : { list_position: parameters.list_position }),
    result_count: parameters.result_count,
  };

  sendGa4Event("hyrox_facility_select", payload);
}

export function trackHyroxCurrentLocationUse(parameters: {
  action_type: "request" | "recenter";
  result_count: number;
}) {
  sendGa4Event("hyrox_current_location_use", {
    action_type: parameters.action_type,
    result_count: parameters.result_count,
  });
}

export function trackHyroxExternalLinkClick(parameters: {
  facility_id: string;
  destination_type: "facility_official_site";
  source: HyroxExternalLinkSource;
}) {
  sendGa4Event("hyrox_external_link_click", {
    facility_id: parameters.facility_id,
    destination_type: parameters.destination_type,
    source: parameters.source,
  });
}
