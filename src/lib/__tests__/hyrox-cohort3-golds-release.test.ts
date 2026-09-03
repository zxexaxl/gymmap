/* eslint-disable @typescript-eslint/no-explicit-any -- generated authority inspection */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { cohortReleaseHash } from "../hyrox-cohort1-release";

const read=(p:string)=>JSON.parse(fs.readFileSync(p,"utf8"));
const release=read("data/hyrox/h3-11d-cohort3-golds-production-release.json");
const evidence=read("data/hyrox/h3-11d-cohort3-golds-evidence.json");
const h3c=read("data/hyrox/h3-11c-source-qualification.json");
const hgyIds=["HGY_CckOFxMw5VG60QfRbUzlk3VMy","HGY_DnvhbwSSMXQWN6DL1AdCp966G","HGY_mkqpr1PrUO2WFjQgpVsFUSkMv"];

test("Cohort 3 is the exact H3-11C Gold's shop-template cohort",()=>{
  const cohort=h3c.cohorts.find((x:any)=>x.id==="h3-11d-c3-golds-shop-template");
  assert.deepEqual(new Set(cohort.hgy_ids),new Set(hgyIds));
  assert.deepEqual(release.facilities.map((x:any)=>x.hgy_id),hgyIds);
  assert.equal(new Set(release.facilities.map((x:any)=>x.location_id)).size,3);
  assert.equal(release.facilities.some((x:any)=>/MUSCLE GATE/i.test(x.facility_name)),false);
  assert.equal(release.hashes.COHORT_3_IDENTITY_SHA256,cohortReleaseHash(release.facilities.map((x:any)=>({hgy_id:x.hgy_id,location_id:x.location_id,slug:x.slug})).sort((a:any,b:any)=>a.hgy_id.localeCompare(b.hgy_id))));
});

test("source inventory is facility-bound and bounded",()=>{
  assert.deepEqual(release.sourceReview,{checked:6,available:6,bindingDrift:0,supportDrift:0,monitorErrors:0,maxConcurrency:4,maxAttempts:2,automaticReconfirmation:false});
  assert.equal(release.sourceDelta.reuse.length,3);
  assert.equal(release.sourceDelta.insert.length,5);
  assert.equal(release.sourceDelta.hold.length,0);
  assert.ok(release.sourceDelta.insert.every((x:any)=>x.facilityBinding==="BRAND_FACILITY_SPECIFIC"));
});

test("review coverage is legal and never manufactures no-positive closure",()=>{
  assert.deepEqual(release.reviewLedger.summary,{cycles:3,units:111,unitSources:141,complete:29,partial:82,sufficient:29,insufficient:82,blocked:0,positiveFound:29,noPositiveFound:0,notAssessed:82});
  for(const row of release.reviewLedger.units){if(row.review_progress==="COMPLETE")assert.deepEqual([row.source_sufficiency,row.positive_outcome],["SUFFICIENT","POSITIVE_FOUND"]);else assert.deepEqual([row.review_progress,row.source_sufficiency,row.positive_outcome],["PARTIAL","INSUFFICIENT","NOT_ASSESSED"]);}
});

test("safe canonical and raw subsets preserve semantics",()=>{
  assert.equal(release.canonicalPositive.equipmentClaims.length,6);
  assert.equal(release.canonicalPositive.capabilityClaims.length,3);
  assert.equal(release.canonicalPositive.evidence.length,9);
  const eq=Object.fromEntries([...new Set(release.canonicalPositive.equipmentClaims.map((x:any)=>x.equipment_slug))].map((slug:any)=>[slug,release.canonicalPositive.equipmentClaims.filter((x:any)=>x.equipment_slug===slug).length]));
  assert.deepEqual(eq,{"farmers-carry-implements":2,"functional-training-lane":1,sandbag:1,treadmill:1,"weighted-sled":1});
  assert.deepEqual(new Set(release.canonicalPositive.capabilityClaims.map((x:any)=>x.capability_slug)),new Set(["discipline-coaching","open-training","outdoor-running-access"]));
  assert.equal(release.rawPersistence.rawFactRows.length,5);
  assert.equal(release.rawPersistence.rawDimensionRows.length,16);
  assert.equal(release.restrictionPersistence.restrictionRows.length,0);
  assert.equal(release.transaction.stationDerivationRows,0);
});

test("every current candidate has monitor authority and exact freshness",()=>{
  assert.equal(release.canonicalMonitorDelta.claims.length,9);
  assert.equal(release.rawMonitorDelta.entries.length,5);
  assert.ok(release.canonicalMonitorDelta.sources.every((x:any)=>x.sourceKey.startsWith("cohort3:src-")));
  assert.ok(release.rawMonitorDelta.sources.every((x:any)=>!x.sourceKey.startsWith("cohort3:")&&x.facilityBinding&&x.facilityIdentityPatternGroups.length>=1));
  assert.ok(release.rawMonitorDelta.entries.every((x:any)=>x.persistenceKeys.length>=1&&x.supportCheck.mode==="TEXT_PATTERN"));
  assert.ok(release.rawPersistence.rawFactRows.every((x:any)=>["raw-physical-component-180-day","raw-equipment-set-assertion-90-day","raw-space-90-day","raw-usage-90-day"].includes(x.freshnessPolicyKey)));
});

test("visual poster is preserved and excluded",()=>{
  assert.equal(release.deferredGaps.length,1);
  assert.equal(release.deferredGaps[0].category,"VISUAL_MONITOR_POLICY_GAP");
  assert.equal(release.deferredGaps[0].releaseDisposition,"DEFERRED_NON_BLOCKING");
  assert.equal(release.deferredGaps[0].stationDerivation,false);
  assert.equal(release.canonicalPositive.equipmentClaims.some((x:any)=>x.location_id==="73a4df85-88c1-4545-a74b-4fcf9a5ffaf8"&&["ski-erg","row-erg","weighted-sled","sandbag"].includes(x.equipment_slug)),false);
});

test("component hashes, arithmetic and transaction boundary are deterministic",()=>{
  const mapping:any={SOURCE_DELTA_SHA256:release.sourceDelta,LEDGER_IMPORT_PACKET_SHA256:release.reviewLedger,CANONICAL_POSITIVE_IMPORT_SHA256:release.canonicalPositive,RAW_FACT_IMPORT_SHA256:release.rawPersistence,RESTRICTION_IMPORT_SHA256:release.restrictionPersistence,CANONICAL_MONITOR_DELTA_SHA256:release.canonicalMonitorDelta,RAW_MONITOR_DELTA_SHA256:release.rawMonitorDelta,DEFERRED_GAP_SHA256:release.deferredGaps};
  for(const [key,value] of Object.entries(mapping))assert.equal(release.hashes[key],cohortReleaseHash(value));
  assert.deepEqual(release.projected,{officialFacilities:82,trainingSources:135,equipmentClaims:170,capabilityClaims:65,trainingEvidence:400,reviewCycles:17,reviewUnits:629,reviewUnitSources:845,invalidations:0,rawFacts:39,rawDimensions:77,restrictions:17,canonicalMonitored:235,rawMonitored:50,equipmentPositiveFacilities:35,capabilityPositiveFacilities:34,anyEnrichedFacilities:41});
  const sql=fs.readFileSync("scripts/hyrox/apply-h3-11d-cohort3-golds-production-release.sql","utf8");
  assert.match(sql,/^-- H3-11D Cohort 3 Gold's exact candidate release/);
  assert.match(sql,/begin;/);assert.match(sql,/commit;/);assert.match(sql,/deterministic-id conflict/);assert.match(sql,/natural-key conflict/);
  assert.doesNotMatch(sql,/on conflict do nothing/i);assert.doesNotMatch(sql,/\b(update|delete|truncate)\s+public\./i);
});

test("evidence and report remain aligned with generated authority",()=>{
  assert.deepEqual(evidence.facilities,release.facilities);
  assert.equal(evidence.observations.length,14);
  const report=fs.readFileSync("docs/hyrox-h3-11d-cohort3-golds-production-data-candidate.md","utf8");
  for(const digest of [...Object.values(release.hashes),release.manifestHash] as string[])assert.match(report,new RegExp(digest));
  for(const directory of ["src/app","src/components"])for(const name of fs.readdirSync(directory,{recursive:true})){const file=`${directory}/${String(name)}`;if(/\.(ts|tsx)$/.test(file))assert.equal(fs.readFileSync(file,"utf8").includes("h3-11d-cohort3-golds"),false,file);}
});
