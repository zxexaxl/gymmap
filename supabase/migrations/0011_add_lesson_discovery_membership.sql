-- Additive Lesson Discovery authority. Applying this migration does not
-- change existing readers; runtime cutover is intentionally separate.
--
-- Audited production reference (2026-09-01):
--   positive Lesson members: 369
--   mappable Lesson members: 358
--   positive stable-ID SHA-256:
--   bd6e62f537d87f1e792ce506652e1b155c3fee7353a468573da2ccce0befa816

create table if not exists public.lesson_location_memberships (
  location_id uuid primary key
    references public.gym_locations(id) on delete cascade,
  authority_source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_location_memberships_authority_source_check
    check (btrim(authority_source) <> '')
);

drop trigger if exists trg_lesson_location_memberships_updated_at
  on public.lesson_location_memberships;
create trigger trg_lesson_location_memberships_updated_at
before update on public.lesson_location_memberships
for each row execute function set_updated_at();

alter table public.lesson_location_memberships enable row level security;

drop policy if exists "public read lesson location memberships"
  on public.lesson_location_memberships;
create policy "public read lesson location memberships"
  on public.lesson_location_memberships
  for select
  using (true);

revoke all on table public.lesson_location_memberships
  from public, anon, authenticated;
grant select on table public.lesson_location_memberships
  to anon, authenticated;
grant all on table public.lesson_location_memberships
  to service_role;

create temporary table lesson_membership_backfill_manifest (
  location_id uuid primary key
);

insert into lesson_membership_backfill_manifest (location_id)
values
  ('00ace1b2-3586-4fa1-b3a3-41ac33fccf97'::uuid),
  ('00e32da0-39cf-486f-8613-43b91b4e2253'::uuid),
  ('018ad6c3-7c03-439d-936a-2583fa08d204'::uuid),
  ('03358968-053c-4d9e-a351-d73c5998a2bd'::uuid),
  ('03c28466-15ed-4254-8914-89e747e4d1fc'::uuid),
  ('04323f77-2eeb-4b40-8728-5eab8c746369'::uuid),
  ('0523126f-b19d-430e-b3b7-1b3f8ffa46f6'::uuid),
  ('05c3f597-9a35-4f4b-870a-f76d2526f58d'::uuid),
  ('06acd243-c482-4f92-b88d-dc1f2a8ceabd'::uuid),
  ('09618323-4243-4b5f-abed-f8757290c074'::uuid),
  ('0a073939-e0b0-4032-854a-6b5c542e2ce2'::uuid),
  ('0a651430-ef60-4d87-9fb5-d014eb69a8cf'::uuid),
  ('0ab423f6-ce0d-4457-b9a9-051705e2b2c6'::uuid),
  ('0ad9211c-42ac-4c3c-969b-c4c99e1c7bba'::uuid),
  ('0b2edc28-bf3f-47e0-b5b0-3303cf50a620'::uuid),
  ('0c1a85bf-eccd-48b7-af72-dd0a03fca018'::uuid),
  ('0c836cba-bc37-4724-a9f1-90d9a51ec2f6'::uuid),
  ('0c94c1ea-2b42-4901-9617-15b7585238d8'::uuid),
  ('0d6c4838-daa4-45ba-abaa-e61c82321b9d'::uuid),
  ('0da31bbf-a76f-4718-86ee-11e25da011b1'::uuid),
  ('0e3962b2-9535-4437-bb90-5dd70219b18a'::uuid),
  ('0f236465-ab4c-4351-b1c1-dfc75f6dd43c'::uuid),
  ('0f863ce4-a2f2-480b-b1c8-84a315891385'::uuid),
  ('0fc2f970-9ed9-4aaf-b841-b8d133fcfd65'::uuid),
  ('10080990-dd5c-4b51-94f5-f905631b560b'::uuid),
  ('10da182a-a717-4671-a56c-b73c4d573c2b'::uuid),
  ('11a70808-f4ce-4db8-ac4c-ad36b7455ff9'::uuid),
  ('11c7c552-2f99-4191-8a4b-2602893c2b0f'::uuid),
  ('11cbe1ac-68bf-452f-b234-f3ad59d23472'::uuid),
  ('11f1aa35-0559-43a4-9cdb-1bc2e511683e'::uuid),
  ('14b57a02-7162-4d20-8d1f-972a986efe25'::uuid),
  ('15048f39-6e49-4dc9-9dd7-f162ad9d9836'::uuid),
  ('164f5be8-e1f3-4c74-9dd1-ffeb4a1c65bd'::uuid),
  ('1660c395-8107-4577-a20e-d41fd0e7b09e'::uuid),
  ('168abfae-3d6a-4d21-8121-d3f486bba370'::uuid),
  ('17ec32f7-7e80-44bf-a3c5-9be6b5381b6d'::uuid),
  ('182a59c2-3803-4f05-b29e-50bd173edb35'::uuid),
  ('185aa989-799f-44a9-b091-6d2b2d1f61a0'::uuid),
  ('18dc9389-1c37-461c-80be-650c6ff23651'::uuid),
  ('18e4d786-21fa-42be-90a1-5a46bbbd09cf'::uuid),
  ('19bbc276-298f-4900-8d49-d3d6c57b6e54'::uuid),
  ('19eb2e11-3c18-443a-aadc-8d729bb760a1'::uuid),
  ('1dcd10e5-4b9a-4633-bc1d-1be9edcb75b8'::uuid),
  ('1e17baad-434b-4eb5-b860-fe3224307673'::uuid),
  ('1e1dc6eb-ec16-4850-978a-ac3c513f55ab'::uuid),
  ('1ea5db28-281b-4957-b98e-6cfff45115f3'::uuid),
  ('201a101d-6d8b-43a3-9c12-c7235e1380d4'::uuid),
  ('210b096b-02f9-49cc-add5-2dce06e8f209'::uuid),
  ('22ab074f-fc13-41df-9f2b-d99705f27c0d'::uuid),
  ('244d14a0-ad1c-47b0-8ed4-d8d29895854e'::uuid),
  ('25a6905c-300f-48c6-9b71-8b752dce69cb'::uuid),
  ('26739c76-fdde-4e5c-9ba9-dbaaf1877683'::uuid),
  ('27327d27-dc03-4b1c-87f1-32b77b14a42b'::uuid),
  ('27d0e5a5-2882-40ba-b4ba-e2e20c07de2a'::uuid),
  ('28e8a93d-afea-43b0-8298-e2cd02bb7bff'::uuid),
  ('2902139c-55ea-46b5-8e20-f9ec780a1bdf'::uuid),
  ('298260d6-d28d-44d6-bfe1-be7434636a9e'::uuid),
  ('2b2ee883-99c9-4c7f-9e9a-6cc60fbecfaf'::uuid),
  ('2b30e721-1ffb-4150-8a71-c2cf866ce064'::uuid),
  ('2baffe57-a60b-441c-bcba-79fc8195f237'::uuid),
  ('2ce96b74-dd12-4f7c-8dec-9c2969912e85'::uuid),
  ('2e43f2e9-3eff-41c0-93dd-912366e74d93'::uuid),
  ('2ead116f-c26b-440b-a424-499523a2a96d'::uuid),
  ('2eb34665-7306-4c4a-8056-bb89f96df65d'::uuid),
  ('2f0eb4d9-dd5d-4411-9ef0-2899bf1d325f'::uuid),
  ('2f7ad40c-ade1-43c3-a959-c4ba21b4f6cf'::uuid),
  ('2fd6da8a-1764-4310-bc65-5761819a1414'::uuid),
  ('30156a18-9e61-491f-9e55-2c7d96a91ffb'::uuid),
  ('317903f2-0565-4d44-8387-672cdad53ce2'::uuid),
  ('31c554b5-36ce-4c97-b6bc-293b9c74e2f0'::uuid),
  ('337ae852-7d5c-4773-9330-08c4a69988c3'::uuid),
  ('34ec37a4-21de-4327-a76c-184c5600018e'::uuid),
  ('351f22af-0774-4ddf-97d2-8c62afdad522'::uuid),
  ('35378a15-5eb1-4539-8996-87e753abe9dd'::uuid),
  ('3567bde9-4641-497b-81c8-3067e41ece0d'::uuid),
  ('35b367b4-dea5-426e-98b4-5d56ef05aa83'::uuid),
  ('382be847-fa4b-4a44-ad2e-09f74540d700'::uuid),
  ('38ee0fae-427d-454e-8716-263617475017'::uuid),
  ('393cd8a5-1675-4127-a4bc-7821fd4f3949'::uuid),
  ('3a242fe1-3d7c-4241-b526-d3139d5a602f'::uuid),
  ('3ac83341-7cba-4a7d-8cd0-910bbfe7a538'::uuid),
  ('3ad133e1-a9fd-41e9-a98f-7e15d0abd4fe'::uuid),
  ('3c357975-c089-4e3b-800f-59353f264fb4'::uuid),
  ('3c3e118a-2991-469a-b91f-7f2b966a3016'::uuid),
  ('3debb6ed-17d5-4f18-8f13-2195a6ab62ca'::uuid),
  ('3e497f9d-59d0-444c-815c-5b9258851e9a'::uuid),
  ('3e4b05c0-3f9f-4c16-8430-2949a16beccd'::uuid),
  ('4083818b-5295-422e-a492-b11a80cee7ba'::uuid),
  ('411439e1-c682-4263-b41a-5612cfb136c7'::uuid),
  ('41c5e004-a3e1-4cc5-9eae-fccde499bd83'::uuid),
  ('424cc279-6576-44f4-b9dc-b47d54940933'::uuid),
  ('425b8c4f-17ec-4fdd-ae8f-12158d93b2c7'::uuid),
  ('430b0c5b-5273-48c9-97c5-5b78697274e3'::uuid),
  ('444cb45a-acaa-4136-9b04-cae047f1cf90'::uuid),
  ('44d936d9-9619-42dc-a422-5b03fc8a9f4c'::uuid),
  ('44f3137a-8811-4765-ab8f-c6c58294245e'::uuid),
  ('46196deb-39ce-4893-9fc3-76f2ca51b9f7'::uuid),
  ('464eecef-90b1-4b58-9037-6d60e669beff'::uuid),
  ('465d7755-5ddf-44bb-93ed-8ee55e5dbd0f'::uuid),
  ('4776a1a2-09a1-49f0-9264-986698ccf499'::uuid),
  ('47cf58fc-2d3f-400e-abbb-f09f99cce630'::uuid),
  ('48313d25-ca7d-417e-8909-323d7de35282'::uuid),
  ('485f6f9b-4e6b-4e73-aa8b-0a1cf09cebcc'::uuid),
  ('48640b21-4ba0-4cdd-8d23-43d6ec4154ef'::uuid),
  ('4a23ce70-8c98-4202-8f80-6a6c52f1a913'::uuid),
  ('4a929dc0-bece-4591-a236-bff7fbc64444'::uuid),
  ('4a9830bc-f964-4246-9a60-3bbd0833cc6f'::uuid),
  ('4ad263d4-204c-4b17-91a6-bdb6cd9c488e'::uuid),
  ('4ae21029-6c58-409c-a959-7c5dc2a725dc'::uuid),
  ('4b86a7bf-7534-4fee-ac5b-b99051aba54b'::uuid),
  ('4bcd39d2-7c66-4929-b0a4-5667e8304252'::uuid),
  ('4bdd7c7e-f36d-4e1e-8f19-a86163ee69f2'::uuid),
  ('4c5a52e9-8cb5-4c70-91c4-5a24e373323d'::uuid),
  ('4d3bd3ba-cb00-44be-bdd6-d9b901f73195'::uuid),
  ('4e05cd99-0d51-417b-b0a7-504b2bb3b392'::uuid),
  ('4e405c7e-9201-4c6e-981e-14fd219b602d'::uuid),
  ('50497437-f4cb-43d8-8563-290951b2de7e'::uuid),
  ('5050299b-2a87-4ccd-9e96-0eafd4af0f3f'::uuid),
  ('511973fa-6cd8-4a43-a504-8335156700ef'::uuid),
  ('51bca044-25e7-4610-91b1-04590a26da4a'::uuid),
  ('52c6ec3d-cd0d-47f2-9407-16baab513f75'::uuid),
  ('52eba899-475e-4cc7-bf27-42591c2fa94f'::uuid),
  ('55aea77b-0f52-4b72-849e-8aab4f5041e7'::uuid),
  ('569aecf8-aa02-41da-b37a-7e2e20f160fb'::uuid),
  ('56bf5c0b-9395-4c9c-968f-d5e1f57c6490'::uuid),
  ('57160390-2938-452a-9b7b-07ea951ecb81'::uuid),
  ('588965e2-30e0-49fc-91c7-de141991e8e2'::uuid),
  ('58b263a7-db8f-441d-b56a-0470dce96b9d'::uuid),
  ('595d83cc-5e45-43b1-9df9-d48602ce19e7'::uuid),
  ('5a8305ce-b2a3-4810-93e6-7d0bb45a122b'::uuid),
  ('5cae9ce1-430f-4b97-a8df-82685e88917c'::uuid),
  ('5da19f77-98fc-41d9-a0b7-e0bd8077badf'::uuid),
  ('5e5f13d2-a1d5-43db-bb23-72e2d90e13c0'::uuid),
  ('5eb4c5ef-ec13-46bb-a3f8-f9afe02bfa5e'::uuid),
  ('5eb89bac-9dc8-49b9-b25e-758133fa2679'::uuid),
  ('5f4b9335-9717-4462-9109-f91ec989658e'::uuid),
  ('5fc7839a-b1e7-486a-8a80-ac7673850a2b'::uuid),
  ('6483517d-07ba-434a-942f-a0aa53967958'::uuid),
  ('64d76b82-3bee-4e75-b86d-06b5ebe3fd94'::uuid),
  ('64e4f833-c98f-4687-9885-14a230e8d1f7'::uuid),
  ('651beadc-a37a-48bf-ac0b-74f754db4ade'::uuid),
  ('65cdb988-4b0b-4717-be43-4f219632b21e'::uuid),
  ('66076b50-7ca1-4b40-9ea3-d1ae833d8abd'::uuid),
  ('664b01e9-78d2-411c-b057-4dc97485f3f6'::uuid),
  ('6712e78e-b781-435d-802e-1b4ac3b01b76'::uuid),
  ('6909f440-0fc4-4551-bb2c-f9093d9d4f26'::uuid),
  ('69a84121-46ea-410e-b104-619ac07b5a85'::uuid),
  ('6a0ecd3f-2fe5-4cf4-8abd-f0e600219717'::uuid),
  ('6adde647-f74a-439e-8694-724a7225a70e'::uuid),
  ('6b17b219-ca52-4668-bf29-682a07f97584'::uuid),
  ('6bc863f7-6303-4120-8af7-90e8d193e5a1'::uuid),
  ('6bd70d3b-ba8a-4572-8a82-69bbb1992040'::uuid),
  ('6c020cab-4640-4d32-856f-c934f88f91a4'::uuid),
  ('6dc5ffa2-5421-46c9-82cf-fc634b4b4549'::uuid),
  ('6e54d33b-009d-45a8-928c-7ddb62e7da44'::uuid),
  ('6eccf134-363d-45a1-bedb-c1469748c5d5'::uuid),
  ('6f8b8eff-8bd7-4b83-b18b-0121cf63d991'::uuid),
  ('7030c555-c51d-4d5c-b9d5-ade8f985690f'::uuid),
  ('7157a181-603e-429a-bac8-b45fa697a436'::uuid),
  ('73a4df85-88c1-4545-a74b-4fcf9a5ffaf8'::uuid),
  ('743c3b39-3ff8-437f-834e-ee622f99a541'::uuid),
  ('74576ce5-3642-4e07-937e-bb8a29eba0ba'::uuid),
  ('74cbc2b6-0e8a-47a1-851c-0ee1c5747176'::uuid),
  ('7506536c-aa79-4717-9d24-1f49fc34e6b0'::uuid),
  ('751fd6cc-2eca-4567-bc0d-221f267dfd14'::uuid),
  ('7537e772-d986-4878-9a0a-b87394888bf2'::uuid),
  ('765a55aa-e058-4058-bce4-f4e23c5ae671'::uuid),
  ('78e2a73f-4ede-4f9c-be0f-dae40737751b'::uuid),
  ('79c1d97b-f4c3-46ae-a00b-58c27ba17635'::uuid),
  ('79ce671d-8b2f-4775-a3af-2f0a1d7d59b4'::uuid),
  ('79ebe020-390d-47cb-9fce-5d8002817d78'::uuid),
  ('7ac86be3-a1cb-48e5-aff2-5404a97283cf'::uuid),
  ('7b478d60-3ef1-449c-af6f-0998232db047'::uuid),
  ('7c8ef293-536e-4b7b-8550-8194fccdecaf'::uuid),
  ('7caf723d-ff00-4dbc-a401-5848196725b4'::uuid),
  ('7d3f79b7-5588-4ba7-a424-740b1d95720a'::uuid),
  ('7d7216d0-692e-45dd-ad3c-6c4980fdc50a'::uuid),
  ('7e20e850-40b7-4fe9-b529-1104c2ea0f97'::uuid),
  ('80fce337-a4b3-44dc-8f39-f872b23adb66'::uuid),
  ('828093ec-b432-4a15-87a4-d838ab9d964d'::uuid),
  ('835e625f-5f75-45a1-a1b2-12e99b82d892'::uuid),
  ('8454a9ce-85cd-47fe-9a3a-41336f81ba47'::uuid),
  ('8576870a-5a72-4883-b321-a15c303029f2'::uuid),
  ('85bb7afe-f968-4ecc-8d4e-1d0a0d482216'::uuid),
  ('861e1cc8-a67b-406c-b6eb-c38b7edba944'::uuid),
  ('86dab9f3-d4dd-4cef-bfad-d5d0df95f4b7'::uuid),
  ('8997e22c-b724-4431-bd21-d7800a01faad'::uuid),
  ('89cd1ac4-77b1-4682-9157-3f3e6c9c8fa2'::uuid),
  ('89e394b2-1095-4b4c-a7f2-7841e72a93d3'::uuid),
  ('8af08331-9f78-41cb-822e-e82263378dbc'::uuid),
  ('8bd1fd5e-2ad1-478c-a4d1-3f2210523d1e'::uuid),
  ('8cf199da-a248-4527-85e5-14f596b59a52'::uuid),
  ('8e11785f-52ba-4ef4-933a-2db32f2181cd'::uuid),
  ('8e45998e-b463-4da4-b184-d03b6b84f468'::uuid),
  ('8ec985d0-ac1f-488d-8726-41079f63a7a4'::uuid),
  ('908b6737-ee22-475d-adcc-7b87f3ee1470'::uuid),
  ('909bf238-fd23-4506-9f90-d758c0efa529'::uuid),
  ('942690ac-4923-4f20-afb3-a643dac24efc'::uuid),
  ('942c2e01-0e8b-490d-acba-794af03ad468'::uuid),
  ('9541d545-4e7c-4288-99dc-5ca6b5305dd0'::uuid),
  ('9615896e-66e8-4246-9ddd-d96c41574d80'::uuid),
  ('962098d1-649a-4bbc-8664-9d7491bea867'::uuid),
  ('9695ea05-b4d0-4203-b843-f34890406fa4'::uuid),
  ('96c9a614-327e-4d50-99d9-ef2c5c9666af'::uuid),
  ('98f753b8-b355-40b2-b67e-f6f84bee5b13'::uuid),
  ('992c9e25-4024-46cb-873d-f36d66065287'::uuid),
  ('9bdfd2b1-eabd-47fc-b865-d10488cbe1c2'::uuid),
  ('9be683a9-d814-427b-8321-4570d4465427'::uuid),
  ('9beb6d1c-8bad-4715-8abd-dce69abb31fa'::uuid),
  ('9d9dd8c7-e287-4943-b8d2-2799857a87e1'::uuid),
  ('9d9f9b81-9cc8-4737-918f-464977ce7923'::uuid),
  ('9df58e2e-045f-482a-ae1e-5f0001276630'::uuid),
  ('9e52aa43-9fa3-48db-a5bc-62897cfa32a3'::uuid),
  ('9eb03e31-decf-484b-8859-83977ce32609'::uuid),
  ('9f043139-a32a-4537-93de-2ff777ca9cc8'::uuid),
  ('9f4b7e31-2b18-4225-ba9b-022299aae5c1'::uuid),
  ('9f7b1380-c866-40e1-adad-b68bdb765b84'::uuid),
  ('a01d4d46-2fd5-48fc-bac4-420ddd9516b4'::uuid),
  ('a024a2e7-7f31-4458-b2c3-145476abe464'::uuid),
  ('a061fb6d-25a4-464c-8a80-a4eb7ab71639'::uuid),
  ('a13e3fe4-3569-4503-9bbb-4c7c69834bef'::uuid),
  ('a18b3504-d1c8-4d05-999a-5fd6c8c6fa47'::uuid),
  ('a1cfa7ee-4cf3-47a9-aff6-b54ecdd320d2'::uuid),
  ('a254f858-f313-48f2-8a8b-c854b9b2b27c'::uuid),
  ('a27ef8cf-d45b-4109-8e33-a56b2ff3f57b'::uuid),
  ('a456a6e2-2a2e-4b47-a477-c552ba213315'::uuid),
  ('a48641f7-89a6-499f-8ad6-ab7008277898'::uuid),
  ('a4aa3543-2b4e-4e70-b946-46adc7580d09'::uuid),
  ('a63ef69d-deee-4fb0-9c96-17c2606e9a5a'::uuid),
  ('a6d34e4b-6cc1-4f6f-9fd0-793240e203d4'::uuid),
  ('a92b62b8-3e03-4e28-bede-099c77740b8b'::uuid),
  ('a9acea09-f2b8-49a7-8d38-0b5977257e09'::uuid),
  ('aa0ac95d-0a4a-49b7-ae0a-2c0bdad7cec5'::uuid),
  ('aa1c49db-7c6a-4ba6-b99a-871ec999f8a2'::uuid),
  ('aa524396-ba4a-4842-8c70-d514274493f6'::uuid),
  ('aa9a5e34-754d-43a5-aee5-3540305ed05c'::uuid),
  ('abe646dd-0b4f-428f-b6d9-a4c93c71c908'::uuid),
  ('ada0c215-5d3e-411b-aa58-9f04eb721c86'::uuid),
  ('aec3bfa8-5db9-485e-b3bb-d696e6d07d15'::uuid),
  ('afe426b7-bf66-4e40-8eb4-9a53f483547d'::uuid),
  ('b0748f9b-8070-4820-9440-01fcce1086a3'::uuid),
  ('b18edf9d-fef4-4cf6-9999-7102a30b28a1'::uuid),
  ('b1dd4591-ecbd-4087-abb8-01938b263ad8'::uuid),
  ('b28336ce-7abc-4dfb-927f-ae8efa78fcc6'::uuid),
  ('b286f695-a3ca-4aa3-b1ab-1ac91e64cb8b'::uuid),
  ('b29488aa-912c-474a-96d9-9c9213fba1dc'::uuid),
  ('b2a0699e-e859-4e51-8534-4de30f106f28'::uuid),
  ('b3def4af-997a-4698-bdeb-bcd46e1d2738'::uuid),
  ('b58b176c-9a0b-4ee7-86eb-17ef4efb4b1b'::uuid),
  ('b5d0318f-f0e1-4f37-80f1-76e8acd011c0'::uuid),
  ('b6abbbf0-0f70-456b-9fb9-a13c8c4eb134'::uuid),
  ('b74415d3-2d04-40a4-ba11-3c91f4e26f1d'::uuid),
  ('b7501ba8-c364-4e0a-9967-a0af60454d9d'::uuid),
  ('b789cc9f-8510-434c-b9e7-6a6e7a450295'::uuid),
  ('b85d7a6c-6e14-444b-89db-686d3d59f2f0'::uuid),
  ('b8e0068d-2728-4c2c-a872-2d44450e33d2'::uuid),
  ('b8f2f557-72a2-418a-8b09-976df593a998'::uuid),
  ('b9a2be3b-5beb-488c-8ab0-c9dad23345ba'::uuid),
  ('ba2062a6-5831-4efc-92e2-b223473da05c'::uuid),
  ('baadc3ff-caa2-4f9d-ab8a-49c7f69ee136'::uuid),
  ('bb9fce1e-593f-4c18-9fb7-89aa6c3f2b67'::uuid),
  ('bbe7a12f-d21c-4d17-989c-2f955c89ee99'::uuid),
  ('bbf47e32-f58a-4def-a996-e97709b02f51'::uuid),
  ('bc432038-904d-450a-82ff-6fa000609de9'::uuid),
  ('bc4db254-ec07-4096-a33d-29507ec7665f'::uuid),
  ('bc7ff933-8ac4-446f-b76b-c366aad32dde'::uuid),
  ('bcffdab7-942f-42df-9751-062628858b4a'::uuid),
  ('bd2eb014-4b53-45e8-bd19-0026488186a5'::uuid),
  ('bde2dab8-c9d1-42f2-9cce-2315dbe783f0'::uuid),
  ('be169f7d-c29b-44e2-b474-3ad820dfbc1d'::uuid),
  ('bef0b8d1-3394-4138-9921-7aa36ac30319'::uuid),
  ('bef4398d-d772-4669-8702-897cfa1b26ba'::uuid),
  ('bf7c5aad-2505-46ea-9a4e-cfa36ecad4d3'::uuid),
  ('c1e2c989-1cfb-4327-92bd-4ef338cecd05'::uuid),
  ('c2bc347e-c362-4acd-907f-f339241f8d8f'::uuid),
  ('c38288a6-0477-48bd-9d26-80003d6010be'::uuid),
  ('c3afed3c-5a34-4eb4-bc9b-57f4a6b2013a'::uuid),
  ('c4a705ac-82e1-4fe4-941d-e2e632addcd1'::uuid),
  ('c4d82126-3eee-4321-87e9-38bbfc9d447b'::uuid),
  ('c53e7e0a-2c89-4e30-8a04-b4fcb6ba5807'::uuid),
  ('c5730a5c-4046-4a3c-9987-61ffaf48bb05'::uuid),
  ('c58a12a7-dfd3-4592-b23d-52657c18d49a'::uuid),
  ('c59c867d-f815-49d9-a932-753a2d903f5f'::uuid),
  ('c657c796-54aa-4e88-bd83-f099ab06edf7'::uuid),
  ('c749c310-41b8-48a9-8aea-58fe28bd9e5a'::uuid),
  ('c7a630c8-ac8b-47af-b817-7a2dc3c2fc4e'::uuid),
  ('c8694141-4d79-4d06-a73b-cad40aaaa4ea'::uuid),
  ('c8c5f48a-7a3d-45d1-9b71-63c77bcb992c'::uuid),
  ('c8fb3095-4f31-4e78-899d-190bd2858613'::uuid),
  ('c90667d4-11e6-40a1-8b9d-33b38247e605'::uuid),
  ('c93337d0-c24a-4b7e-b15a-dc5a02307bde'::uuid),
  ('c988e636-3c6b-4d3b-8988-abfeac4e844a'::uuid),
  ('ca898b23-03ed-4bbc-be14-7f8a48f21016'::uuid),
  ('cb527185-617f-48b1-8e41-189d7bceec9f'::uuid),
  ('cc32cd61-2224-403b-9e9f-c673eae0deaf'::uuid),
  ('cd5e7438-ca50-4458-8a07-20cabe3e9e4f'::uuid),
  ('ce0f6e5d-3455-4305-85b8-68a50dd5a57b'::uuid),
  ('ce1fe2ba-7861-402b-956e-dc3c36a29543'::uuid),
  ('ce3e0130-27bc-4c0f-9220-d4a1e8fb9bf4'::uuid),
  ('cf9547b0-a38d-48b0-99aa-b9aa7db2a1fd'::uuid),
  ('cfa96f1a-1e83-42cf-9dcf-c51beea96eb9'::uuid),
  ('cfb41388-ffda-447d-a609-ddb8fbc5bfac'::uuid),
  ('d07c4ee0-e8b4-4813-a2f3-7d0693e3b164'::uuid),
  ('d0bc145b-d10e-4303-ae9b-fa6b64483f82'::uuid),
  ('d12c13b2-a6b7-4845-8590-577a5444a0a9'::uuid),
  ('d24cef24-e2bb-4137-a227-34e451c2639d'::uuid),
  ('d2f92acb-e82f-4b48-ac42-28213ce6134b'::uuid),
  ('d4287117-6a00-48a9-bf86-6bd971b01424'::uuid),
  ('d548b263-bcb0-4d41-9b4e-ee518074b301'::uuid),
  ('d5b340d4-cbde-4e09-9df0-df2e18f8ff34'::uuid),
  ('d6327390-b3a1-450f-a465-0b19af531dca'::uuid),
  ('d6d78edb-20fe-4732-90ad-0aed0f47dd22'::uuid),
  ('d724bed0-1782-4763-9981-32d87f4a906d'::uuid),
  ('d72f7e59-9152-425c-8906-66a17abd4179'::uuid),
  ('d75c411f-2b58-476d-aa68-f7bde9000002'::uuid),
  ('d8e80d88-49f5-40f2-965a-c8f67e9fee68'::uuid),
  ('d9b45eec-2081-4229-8896-86fb188aee47'::uuid),
  ('db43ad08-4ef1-4319-b4d1-c5fd9e3f232b'::uuid),
  ('db6a571d-6a93-4554-ac9d-f0c2ce69eb23'::uuid),
  ('dc9a4b60-578b-41b9-a2c1-2b4a8e1a6dbc'::uuid),
  ('dcd7ba00-e1aa-4ec9-93df-e9756af4c1d7'::uuid),
  ('dcf1e86c-bd44-4b48-b806-86f949f2a60c'::uuid),
  ('dd4f01fe-6fa6-40c6-aa18-1b8069ee2a68'::uuid),
  ('dfabad5e-8467-4c8c-872b-d73d3263bef2'::uuid),
  ('dfb825c8-a54c-4e34-a4c4-cadf7f3fc1ea'::uuid),
  ('e0bbcdb4-d0b1-4fc0-bd6c-754634dc03a4'::uuid),
  ('e0d65ac4-daf4-47cf-b767-d625e4bdb76e'::uuid),
  ('e146cfd2-23b3-4d37-91c8-bbbce79fac6f'::uuid),
  ('e1ef05b0-8681-4b07-ba62-e4e9923fea83'::uuid),
  ('e2919fb8-c681-4c3d-8995-816c974d2d4f'::uuid),
  ('e3dd4357-765c-4c6d-9d87-117f5a8c8d46'::uuid),
  ('e50f9b01-d9ba-4732-b648-b397946a1804'::uuid),
  ('e5250e8c-8a51-41e1-87e6-56f332efc044'::uuid),
  ('e6146c86-7f0d-44ac-b9a3-897aae6bf8c0'::uuid),
  ('e84c2ea2-bc63-4788-b050-590cfefebe42'::uuid),
  ('eaa92d86-5be5-4666-b2b6-88286c679fb8'::uuid),
  ('eb8fa12a-f0e2-4b0d-9ba6-8d9d214c3402'::uuid),
  ('ec0cc1c7-fa4d-42c7-8959-28548f43cda8'::uuid),
  ('ed70f030-3c2e-4e9e-a9e1-eb97fbb74b43'::uuid),
  ('ed7a84ff-79bb-4a85-a5a4-13e5f51c8139'::uuid),
  ('ed9cacc2-de55-4018-8ffc-0ec1fbb20a71'::uuid),
  ('edaa978c-bd36-4b50-be59-10c95da79242'::uuid),
  ('edfc105a-7b1c-4445-a992-087a5751a76b'::uuid),
  ('eeb7591f-f951-43e6-a9ab-6f75a05ac9db'::uuid),
  ('ef04dd0c-af52-4e84-95f6-ca83a1b8752a'::uuid),
  ('ef9af54d-f1e3-4b76-8420-c0c095272c33'::uuid),
  ('efcff219-a407-49a8-907c-875ed89356e7'::uuid),
  ('f184b593-1779-410d-9224-c1616f4a45e8'::uuid),
  ('f1cc03a7-927f-4e3d-95e1-1ced5afad241'::uuid),
  ('f1cc1fbf-be4e-4037-963b-0e59bbad91f6'::uuid),
  ('f3c2b93c-d387-45bf-a026-6bf35b40ed9c'::uuid),
  ('f443a3eb-fd84-4a7f-aaa2-39aacd1f64eb'::uuid),
  ('f4800198-859e-4f8f-8505-446166c21389'::uuid),
  ('f643f446-b52d-4b53-9115-058f83cb7f02'::uuid),
  ('f719e993-a9bb-4929-bebe-5422c63fced7'::uuid),
  ('f727954d-7f06-4bc7-b4ae-1330c2ae2d77'::uuid),
  ('f7ce3ad0-a886-4020-bd31-adc7635b30c2'::uuid),
  ('f8476603-5974-43b2-9ed8-f0aa71d1b1d8'::uuid),
  ('f8a7114e-09c7-4ba2-9e11-938cfe88cae8'::uuid),
  ('f93e8f4e-4bca-471b-b362-60d1858d5e89'::uuid),
  ('f94f8ca2-b0c6-460f-b8c9-8ce9a31f66de'::uuid),
  ('fa583059-6ab3-4fae-b31a-1c53db766636'::uuid),
  ('fa7e926b-cf60-4f5c-bfb3-9a90a0417fbf'::uuid),
  ('fb51d9cd-2c67-4bc9-a787-9e7e2ceb2ae7'::uuid),
  ('fb8c476c-aff0-40ad-a45c-8edb48efcc0a'::uuid),
  ('fddd580f-a5f6-4b9f-b94c-866806bab69f'::uuid),
  ('fdf9bab6-43d0-4d3b-9670-82a8f720e17b'::uuid),
  ('ffd3af8e-082a-47ce-9115-7e5f2590d094'::uuid),
  ('fff68016-fd3b-4a66-adca-96fd35ed4269'::uuid);

do $$
declare
  manifest_count integer;
begin
  select count(*) into manifest_count
  from lesson_membership_backfill_manifest;

  if manifest_count <> 369 then
    raise exception
      'Lesson membership manifest must contain 369 unique IDs; found %',
      manifest_count;
  end if;
end;
$$;

insert into public.lesson_location_memberships (
  location_id,
  authority_source
)
select
  manifest.location_id,
  'audited-legacy-lesson-discovery-2026-09-01'
from lesson_membership_backfill_manifest manifest
join public.gym_locations locations
  on locations.id = manifest.location_id
on conflict (location_id) do nothing;

drop table lesson_membership_backfill_manifest;

-- Additive Lesson-specific RPCs. Existing runtime functions remain unchanged.

-- Summary-only RPCs for public schedule reads. Both preserve the existing
-- latest-period rule: dated rows use the latest date per location; locations
-- without any dated row keep their legacy undated schedules.

create or replace function public.get_lesson_latest_schedule_periods_by_location()
returns table (
  location_id uuid,
  latest_valid_from date
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    schedules.location_id,
    max(schedules.valid_from) as latest_valid_from
  from public.class_schedules as schedules
  join public.gym_locations as locations
    on locations.id = schedules.location_id
    and locations.is_active = true
  join public.lesson_location_memberships as lesson_membership
    on lesson_membership.location_id = locations.id
  where schedules.valid_from is not null
  group by schedules.location_id
  order by schedules.location_id;
$$;

create or replace function public.get_lesson_popular_program_summary()
returns table (
  id uuid,
  name text,
  slug text,
  category text,
  description text,
  intensity_level integer,
  beginner_friendly boolean,
  default_duration_minutes integer,
  created_at timestamptz,
  updated_at timestamptz,
  schedule_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_periods as (
    select
      schedules.location_id,
      max(schedules.valid_from) filter (where schedules.valid_from is not null) as latest_valid_from
    from public.class_schedules as schedules
    join public.gym_locations as locations
      on locations.id = schedules.location_id
      and locations.is_active = true
    join public.lesson_location_memberships as lesson_membership
      on lesson_membership.location_id = locations.id
    group by schedules.location_id
  ),
  current_schedule_counts as (
    select
      schedules.program_id,
      count(*)::bigint as schedule_count
    from public.class_schedules as schedules
    join latest_periods on latest_periods.location_id = schedules.location_id
    where latest_periods.latest_valid_from is null
      or schedules.valid_from = latest_periods.latest_valid_from
    group by schedules.program_id
  )
  select
    programs.id,
    programs.name,
    programs.slug,
    programs.category,
    programs.description,
    programs.intensity_level,
    programs.beginner_friendly,
    programs.default_duration_minutes,
    programs.created_at,
    programs.updated_at,
    current_schedule_counts.schedule_count
  from public.programs as programs
  join current_schedule_counts on current_schedule_counts.program_id = programs.id;
$$;

-- The application reads public data with the anon key. Revoke PostgreSQL's
-- default PUBLIC execute privilege, then grant only the roles used by it.
revoke all on function public.get_lesson_latest_schedule_periods_by_location() from public;
revoke all on function public.get_lesson_popular_program_summary() from public;

grant execute on function public.get_lesson_latest_schedule_periods_by_location() to anon, authenticated;
grant execute on function public.get_lesson_popular_program_summary() to anon, authenticated;

-- Rollback:
-- drop function public.get_lesson_latest_schedule_periods_by_location();
-- drop function public.get_lesson_popular_program_summary();

create or replace function search_lesson_class_schedule_page(
  p_query text default '',
  p_query_compact text default '',
  p_canonical_names text[] default array[]::text[],
  p_program_brands text[] default array[]::text[],
  p_weekday text default '',
  p_time_range text default '',
  p_duration_range text default '',
  p_brand text default '',
  p_area text default '',
  p_offset integer default 0,
  p_limit integer default 20
)
returns table (
  schedule_id uuid,
  result_order bigint,
  total_count bigint,
  latest_schedule_update timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_periods as (
    select
      location_id,
      max(valid_from) filter (where valid_from is not null) as latest_valid_from
    from class_schedules
    group by location_id
  ),
  eligible as (
    select
      schedules.id,
      schedules.weekday,
      schedules.start_time,
      schedules.duration_minutes,
      locations.name as location_name,
      coalesce(schedules.extracted_at, schedules.updated_at) as schedule_update,
      case
        when coalesce(p_query, '') = '' then 0
        when schedules.normalized_text = p_query
          or schedules.comparison_key = p_query_compact
          or lower(coalesce(schedules.canonical_program_name, '')) = p_query
          then 300
        when schedules.normalized_text like p_query || '%'
          or schedules.comparison_key like p_query_compact || '%'
          or lower(coalesce(schedules.canonical_program_name, '')) like p_query || '%'
          then 200
        when schedules.normalized_text like '%' || p_query || '%'
          or schedules.comparison_key like '%' || p_query_compact || '%'
          or lower(coalesce(schedules.canonical_program_name, '')) like '%' || p_query || '%'
          or lower(coalesce(schedules.program_brand, '')) like '%' || p_query || '%'
          or lower(programs.name) like '%' || p_query || '%'
          then 100
        when schedules.canonical_program_name = any(coalesce(p_canonical_names, array[]::text[])) then 80
        when schedules.program_brand = any(coalesce(p_program_brands, array[]::text[])) then 82
        else 0
      end as match_score
    from class_schedules as schedules
    join gym_locations as locations on locations.id = schedules.location_id
    join public.lesson_location_memberships as lesson_membership
      on lesson_membership.location_id = locations.id
    join gym_brands as brands on brands.id = locations.brand_id
    join programs on programs.id = schedules.program_id
    join latest_periods on latest_periods.location_id = schedules.location_id
    where locations.is_active = true
      and (
        latest_periods.latest_valid_from is null
        or schedules.valid_from = latest_periods.latest_valid_from
      )
      and (coalesce(p_weekday, '') = '' or schedules.weekday = p_weekday)
      and (
        coalesce(p_time_range, '') = ''
        or (p_time_range = 'morning' and schedules.start_time >= time '06:00' and schedules.start_time < time '12:00')
        or (p_time_range = 'afternoon' and schedules.start_time >= time '12:00' and schedules.start_time < time '17:00')
        or (p_time_range = 'evening' and schedules.start_time >= time '17:00' and schedules.start_time < time '23:00')
      )
      and (
        coalesce(p_duration_range, '') = ''
        or (p_duration_range = 'short' and schedules.duration_minutes <= 45)
        or (p_duration_range = 'medium' and schedules.duration_minutes between 46 and 59)
        or (p_duration_range = 'long' and schedules.duration_minutes >= 60)
      )
      and (
        coalesce(p_brand, '') = ''
        or lower(brands.name) like '%' || lower(p_brand) || '%'
      )
      and (
        coalesce(p_area, '') = ''
        or lower(
          concat_ws(
            ' ',
            locations.name,
            locations.slug,
            locations.prefecture,
            locations.city,
            locations.address_line
          )
        ) like '%' || lower(p_area) || '%'
      )
  ),
  matched as (
    select *
    from eligible
    where coalesce(p_query, '') = '' or match_score > 0
  ),
  ranked as (
    select
      id,
      row_number() over (
        order by
          case weekday
            when 'monday' then 0
            when 'tuesday' then 1
            when 'wednesday' then 2
            when 'thursday' then 3
            when 'friday' then 4
            when 'saturday' then 5
            when 'sunday' then 6
            else 7
          end,
          start_time,
          duration_minutes nulls last,
          match_score desc,
          location_name,
          id
      ) as row_number,
      count(*) over () as match_count,
      max(schedule_update) over () as latest_update
    from matched
  ),
  page as (
    select *
    from ranked
    where row_number > greatest(coalesce(p_offset, 0), 0)
      and row_number <= greatest(coalesce(p_offset, 0), 0) + greatest(coalesce(p_limit, 20), 1)
  ),
  stats as (
    select
      count(*)::bigint as match_count,
      max(schedule_update) as latest_update
    from matched
  )
  select
    page.id,
    page.row_number,
    page.match_count,
    page.latest_update
  from page

  union all

  select
    null::uuid,
    0::bigint,
    stats.match_count,
    stats.latest_update
  from stats
  where not exists (select 1 from page)

  order by 2;
$$;

revoke all on function search_lesson_class_schedule_page(
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  text,
  integer,
  integer
) from public;

grant execute on function search_lesson_class_schedule_page(
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  text,
  integer,
  integer
) to anon, authenticated;

create or replace function favorite_lesson_class_schedule_week(
  p_program_ids uuid[] default array[]::uuid[],
  p_area text default '',
  p_start_weekday integer default 0,
  p_limit integer default 120
)
returns table (
  schedule_id uuid,
  result_order bigint,
  total_count bigint,
  latest_schedule_update timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_periods as (
    select
      location_id,
      max(valid_from) filter (where valid_from is not null) as latest_valid_from
    from class_schedules
    group by location_id
  ),
  eligible as (
    select
      schedules.id,
      schedules.start_time,
      schedules.duration_minutes,
      programs.name as program_name,
      locations.name as location_name,
      coalesce(schedules.extracted_at, schedules.updated_at) as schedule_update,
      case schedules.weekday
        when 'monday' then 0
        when 'tuesday' then 1
        when 'wednesday' then 2
        when 'thursday' then 3
        when 'friday' then 4
        when 'saturday' then 5
        when 'sunday' then 6
        else 7
      end as weekday_index
    from class_schedules as schedules
    join gym_locations as locations on locations.id = schedules.location_id
    join public.lesson_location_memberships as lesson_membership
      on lesson_membership.location_id = locations.id
    join programs on programs.id = schedules.program_id
    join latest_periods on latest_periods.location_id = schedules.location_id
    where locations.is_active = true
      and schedules.program_id = any(coalesce(p_program_ids, array[]::uuid[]))
      and (
        latest_periods.latest_valid_from is null
        or schedules.valid_from = latest_periods.latest_valid_from
      )
      and (
        coalesce(p_area, '') = ''
        or lower(
          concat_ws(
            ' ',
            locations.name,
            locations.slug,
            locations.prefecture,
            locations.city,
            locations.address_line,
            locations.nearest_station
          )
        ) like '%' || lower(p_area) || '%'
      )
  ),
  day_ranked as (
    select
      eligible.*,
      row_number() over (
        partition by weekday_index
        order by start_time, duration_minutes nulls last, program_name, location_name, id
      ) as day_row_number
    from eligible
  ),
  selected as (
    select *
    from day_ranked
    order by
      day_row_number,
      mod(weekday_index - greatest(least(coalesce(p_start_weekday, 0), 6), 0) + 7, 7),
      start_time,
      program_name,
      location_name,
      id
    limit greatest(least(coalesce(p_limit, 120), 200), 1)
  ),
  ordered as (
    select
      id,
      row_number() over (
        order by
          mod(weekday_index - greatest(least(coalesce(p_start_weekday, 0), 6), 0) + 7, 7),
          start_time,
          duration_minutes nulls last,
          program_name,
          location_name,
          id
      ) as row_number
    from selected
  ),
  stats as (
    select
      count(*)::bigint as match_count,
      max(schedule_update) as latest_update
    from eligible
  )
  select
    ordered.id,
    ordered.row_number,
    stats.match_count,
    stats.latest_update
  from ordered
  cross join stats

  union all

  select
    null::uuid,
    0::bigint,
    stats.match_count,
    stats.latest_update
  from stats
  where not exists (select 1 from ordered)

  order by 2;
$$;

revoke all on function favorite_lesson_class_schedule_week(
  uuid[],
  text,
  integer,
  integer
) from public;

grant execute on function favorite_lesson_class_schedule_week(
  uuid[],
  text,
  integer,
  integer
) to anon, authenticated;
