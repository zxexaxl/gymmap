"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl, type ErrorEvent as MapLibreErrorEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  MAPLIBRE_WORKER_URL,
  OPENFREEMAP_STYLE_URL,
  type VectorBasemapFailureReason,
} from "@/lib/map-basemap";

const LOAD_TIMEOUT_MS = 10_000;
const PROVIDER_ERROR_THRESHOLD = 3;
const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org/">OpenFreeMap</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function OpenFreeMapVectorBasemap({
  onFatal,
}: {
  onFatal: (reason: VectorBasemapFailureReason) => void;
}) {
  const map = useMap();

  useEffect(() => {
    let disposed = false;
    let failed = false;
    let loaded = false;
    let providerErrorCount = 0;
    let layer: ReturnType<typeof maplibreGL> | null = null;
    let loadTimer: number | null = null;
    const initializationStartedAt = performance.now();

    const fail = (reason: VectorBasemapFailureReason) => {
      if (!disposed && !failed) {
        failed = true;
        onFatal(reason);
      }
    };

    try {
      setWorkerUrl(MAPLIBRE_WORKER_URL);
      layer = maplibreGL({
        style: OPENFREEMAP_STYLE_URL,
        interactive: false,
        attributionControl: { customAttribution: OPENFREEMAP_ATTRIBUTION },
        fadeDuration: 0,
      }).addTo(map);

      const vectorMap = layer.getMaplibreMap();

      vectorMap.once("load", () => {
        loaded = true;
        providerErrorCount = 0;
        console.info("[map] OpenFreeMap vector ready", {
          readyMs: Math.round(performance.now() - initializationStartedAt),
        });
        if (loadTimer !== null) {
          window.clearTimeout(loadTimer);
          loadTimer = null;
        }
      });
      vectorMap.on("webglcontextlost", () => fail("webgl-context-lost"));
      vectorMap.on("error", (event: MapLibreErrorEvent) => {
        console.error("[map] OpenFreeMap vector error", event.error);
        providerErrorCount += 1;

        if (!loaded || providerErrorCount >= PROVIDER_ERROR_THRESHOLD) {
          fail(loaded ? "provider" : "initialization");
        }
      });

      loadTimer = window.setTimeout(() => fail("load-timeout"), LOAD_TIMEOUT_MS);
    } catch (error) {
      console.error("[map] OpenFreeMap vector initialization failed", error);
      fail("initialization");
    }

    return () => {
      disposed = true;
      if (loadTimer !== null) {
        window.clearTimeout(loadTimer);
      }
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    };
  }, [map, onFatal]);

  return null;
}
