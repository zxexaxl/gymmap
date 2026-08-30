import "server-only";

import { getSupabaseClient } from "@/lib/supabase";
import {
  HYROX_DISCIPLINE_SLUG,
  loadCompleteHyroxDiscoveryData,
  type HyroxDiscoveryGateway,
} from "@/lib/hyrox-discovery";

export async function loadHyroxDiscoveryData() {
  const supabase = getSupabaseClient();
  const gateway: HyroxDiscoveryGateway = {
    async searchPage(offset, limit) {
      const { data, error } = await supabase.rpc("search_training_locations", {
        p_discipline_slug: HYROX_DISCIPLINE_SLUG,
        p_official_only: true,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        throw new Error(`HYROX publication search failed: ${error.message}`);
      }

      return data ?? [];
    },
    async loadOfficialUrls(locationIds) {
      if (locationIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("gym_locations")
        .select("id, official_url")
        .in("id", locationIds);

      if (error) {
        throw new Error(`HYROX facility URL lookup failed: ${error.message}`);
      }

      return data ?? [];
    },
  };

  return loadCompleteHyroxDiscoveryData(gateway);
}
