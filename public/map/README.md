# GymMap map runtime assets

This directory contains the version-owned assets used by the P1-M1 OpenFreeMap
vector basemap candidate.

- `gymmap-openfreemap-liberty-v1.json` is generated from OpenFreeMap Liberty
  (`https://tiles.openfreemap.org/styles/liberty`) by
  `scripts/generate-gymmap-openfreemap-style.mjs`. The generator pins and checks
  the reviewed upstream SHA-256 before applying GymMap cartography.
- `maplibre-gl-worker-v6.6.0.mjs` and `maplibre-gl-shared.mjs` are unmodified
  files from `maplibre-gl@6.6.0`. Both files are required because the module
  worker imports the shared runtime next to itself.

Reviewed SHA-256 values:

- upstream Liberty: `6010998863b4876911ac9a2d62c9a28d97c8877f6d20cd158b74808572257b60`
- generated GymMap style v1: `9128cbf4ee5ca74b626cf3669c104b4a41a0451c6269c512c28f7a2fb31d2577`
- MapLibre worker: `b081c9b3d0691d9d85552b5624f2601f69f24ed37573959d279d322e98e4ee2f`
- MapLibre shared worker runtime: `34c2cb0330cec92e81c4fa7344e7008451442bbb9cca1da3465db4041a934073`

Licenses and attribution:

- MapLibre GL JS: BSD-3-Clause (`node_modules/maplibre-gl/LICENSE.txt`)
- MapLibre GL Leaflet adapter: ISC
- OpenFreeMap project/style: MIT; its public service is provided as-is
- OpenMapTiles schema/components: see the OpenFreeMap included-project notices
- OpenStreetMap data: ODbL; visible attribution is required

The runtime displays: `OpenFreeMap © OpenMapTiles Data from OpenStreetMap`.
