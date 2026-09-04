import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {lessonCoordinatePublicationSqlGuard}=require(path.resolve('src/lib/lesson-coordinate-publication.ts'));
const guard=lessonCoordinatePublicationSqlGuard();
let assertions=0;
function query(sql, fails=false, pattern=/LESSON_COORDINATE_PUBLICATION_HOLD/) {
 const r=spawnSync('psql',['-X','-h','localhost','-U','postgres','-d','lesson_guard_test','-qAt','-v','ON_ERROR_STOP=1','-c',sql],{encoding:'utf8'});
 assertions++;
 if(fails){assert.notEqual(r.status,0);assert.match(r.stderr,pattern);}else assert.equal(r.status,0,r.stderr);
 return r.stdout.trim();
}
query(`create table class_schedules(id integer primary key,location_id uuid references gym_locations, label text);
insert into gym_locations(id,name,slug,latitude,longitude,is_active) values ('00000000-0000-4000-8000-000000000001','existing HOLD','existing-hold',null,null,true);
insert into class_schedules values(1,'00000000-0000-4000-8000-000000000001','unchanged');`);
const snapshot=()=>query(`select jsonb_build_object('locations',(select jsonb_agg(to_jsonb(t) order by id) from gym_locations t),'memberships',(select jsonb_agg(to_jsonb(t) order by location_id) from lesson_location_memberships t),'schedules',(select jsonb_agg(to_jsonb(t) order by id) from class_schedules t));`);
const before=snapshot();
query(`begin;
insert into lesson_location_memberships values('00000000-0000-4000-8000-000000000001','requested');
update class_schedules set label='must rollback';
insert into gym_locations(id,name,slug,latitude,longitude) values('00000000-0000-4000-8000-000000000002','valid','valid',35,139);
insert into lesson_location_memberships values('00000000-0000-4000-8000-000000000002','valid');
${guard} commit;`,true);
assertions++; assert.equal(snapshot(),before);
// A coordinate write and schedule write preceding a later invalid target must both roll back.
query(`begin; update gym_locations set latitude=35,longitude=139; update class_schedules set label='must rollback';
insert into lesson_location_memberships values('00000000-0000-4000-8000-000000000001','valid');
insert into gym_locations(id,name,slug) values('00000000-0000-4000-8000-000000000003','invalid','invalid');
insert into lesson_location_memberships values('00000000-0000-4000-8000-000000000003','invalid');
${guard} commit;`,true);
assertions++; assert.equal(snapshot(),before);
for(const n of ["'Infinity'","'-Infinity'"]){
 query(`begin; update gym_locations set latitude=${n}; ${guard} commit;`,true,/numeric field overflow|infinite value/);
 assertions++;assert.equal(snapshot(),before);
}
// Exact candidate predicate; only fixture data here, not replacement business logic.
const nas=[[35.651980,139.447217],[35.705810,139.904634],[35.760570,139.628253],[35.845536,139.647899],[35.947483,139.641284],[35.668015,139.608705],[35.618258,139.726683],[35.664095,139.860002]];
query('begin; '+nas.map(([lat,lng],i)=>`with loc as (insert into gym_locations(name,slug,latitude,longitude) values('NAS fixture','nas-${i}',${lat},${lng}) returning id) insert into lesson_location_memberships select id,'fixture' from loc;`).join('\n')+guard+' rollback;');
assertions++;assert.equal(snapshot(),before);
console.log(JSON.stringify({status:'PASS',additionalAssertions:assertions,failures:0,existingSlugPublicationRejected:true,locationMembershipScheduleCoordinateRollback:true,validNasMixedBatch:true}));
